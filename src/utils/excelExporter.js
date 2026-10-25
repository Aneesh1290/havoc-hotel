import ExcelJS from 'exceljs';
import { format, parseISO, subDays, startOfDay } from 'date-fns';

/**
 * Styles & fills matching the corporate spreadsheet reference:
 * - Top Date banner: Soft Sage Green (#C8E6C9)
 * - Hotel Property banner: Deep Navy / Slate (#102641) with Gold / White text
 * - Section Headers:
 *   - Dark Green (#1E5631) for TOTAL SL, SN, PHONE NO, E-MAIL ID, DATE, TIME/SLOT, ROOM CATEGORY, ROOMS, AMOUNT, STATUS
 *   - Soft Pink (#E8B4B8) for ORDER NO and NAME
 * - Subtotal Row: Light Pastel Green (#F1F8E9) with bold counts and sums
 */
const headerBgDarkGreen = '1E5631';
const headerBgPink = 'E8B4B8';
const dateBannerBg = 'C8E6C9';
const hotelBannerBg = '102641';
const hotelSubtotalBg = 'D1E7DD';
const subtotalBg = 'F1F8E9';

const borderThin = {
  top: { style: 'thin', color: { argb: 'D1D5DB' } },
  left: { style: 'thin', color: { argb: 'D1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
  right: { style: 'thin', color: { argb: 'D1D5DB' } }
};

/**
 * Builds standard column widths for all worksheets
 */
function applyWorksheetColumns(worksheet) {
  worksheet.views = [{ showGridLines: true }];
  worksheet.columns = [
    { key: 'totalSl', width: 12 },   // Col A: TOTAL SL
    { key: 'sn', width: 8 },         // Col B: SN
    { key: 'orderNo', width: 22 },    // Col C: ORDER NO (#PAYDUE_...)
    { key: 'name', width: 26 },       // Col D: NAME
    { key: 'phone', width: 18 },      // Col E: PHONE NO
    { key: 'email', width: 30 },      // Col F: E-MAIL ID
    { key: 'date', width: 16 },       // Col G: DATE
    { key: 'stayType', width: 16 },   // Col H: TIME / STAY
    { key: 'roomType', width: 32 },   // Col I: ROOM TYPE
    { key: 'rooms', width: 10 },      // Col J: ROOMS
    { key: 'amount', width: 16 },     // Col K: AMOUNT
    { key: 'status', width: 14 }      // Col L: STATUS
  ];
}

/**
 * Renders the table header row with Dark Green and Pink columns
 */
function renderHeaderRow(worksheet) {
  const headerRow = worksheet.addRow([
    'TOTAL SL',
    'SN',
    'ORDER NO',
    'NAME',
    'PHONE NO',
    'E-MAIL ID',
    'DATE',
    'TIME / STAY',
    'ROOM CATEGORY',
    'ROOMS',
    'AMOUNT (₹)',
    'STATUS'
  ]);
  headerRow.height = 26;

  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.border = borderThin;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    if (colNumber === 3 || colNumber === 4) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBgPink } };
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '111827' } };
    } else {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBgDarkGreen } };
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFF' } };
    }
  });

  return headerRow;
}

/**
 * Formats order number consistently (e.g. #PAYDUE_SP_01)
 */
function getOrderCode(b, sn) {
  let idStr = b.id ? b.id.toString() : sn.toString();
  if (idStr.startsWith('#PAYDUE') || idStr.startsWith('PAYDUE')) {
    return idStr.startsWith('#') ? idStr : `#${idStr}`;
  }
  const numPart = idStr.replace(/\D/g, '') || sn.toString();
  const padded = numPart.length === 1 ? `0${numPart}` : numPart;
  return `#PAYDUE_SP_${padded}`;
}

/**
 * Helper to build Date-wise blocks for a single hotel or general date list
 */
function buildDateGroupedBlocks(worksheet, bookingList, overallStartingSl = 1) {
  if (!bookingList || bookingList.length === 0) {
    return overallStartingSl;
  }

  // Group by date
  const dateGroups = {};
  bookingList.forEach(b => {
    let dateLabel = 'Undated Stays';
    if (b.checkIn) {
      try {
        dateLabel = format(parseISO(b.checkIn), 'MMM d (eee)');
      } catch (e) {
        dateLabel = b.checkIn;
      }
    }
    if (!dateGroups[dateLabel]) {
      dateGroups[dateLabel] = [];
    }
    dateGroups[dateLabel].push(b);
  });

  let runningTotalSl = overallStartingSl - 1;
  const groupKeys = Object.keys(dateGroups);

  groupKeys.forEach((dateKey, gIdx) => {
    const groupBookings = dateGroups[dateKey];

    // 1. Date Banner Row (Merged A to L)
    const bannerRow = worksheet.addRow([dateKey, '', '', '', '', '', '', '', '', '', '', '']);
    const bannerNum = bannerRow.number;
    worksheet.mergeCells(`A${bannerNum}:L${bannerNum}`);
    bannerRow.height = 24;
    bannerRow.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: '111827' } };
    bannerRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    bannerRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: dateBannerBg } };
    for (let c = 1; c <= 12; c++) {
      bannerRow.getCell(c).border = borderThin;
    }

    // 2. Section Header Row
    renderHeaderRow(worksheet);

    let groupRoomsTotal = 0;
    let groupAmountTotal = 0;

    // 3. Data Rows
    groupBookings.forEach((b, itemIdx) => {
      runningTotalSl += 1;
      const sn = itemIdx + 1;
      const roomsCount = b.rooms || 1;
      const amt = b.amount || 0;
      groupRoomsTotal += roomsCount;
      groupAmountTotal += amt;

      const stayTime = b.stayDuration || (b.roomName?.toLowerCase().includes('12') ? '12 Hours' : '24 Hours');
      const orderCode = getOrderCode(b, sn);

      const dataRow = worksheet.addRow([
        runningTotalSl,
        sn,
        orderCode,
        b.name || 'Guest',
        b.phone || '-',
        b.email || '-',
        dateKey,
        stayTime,
        b.roomName || 'Deluxe Room',
        roomsCount,
        amt,
        b.status || 'Confirmed'
      ]);

      dataRow.height = 22;
      dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = borderThin;
        cell.font = { name: 'Arial', size: 9 };

        if (colNumber === 4 || colNumber === 6 || colNumber === 9) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else if (colNumber === 11) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '₹#,##0';
        } else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    // 4. Date Subtotal Row
    const subtotalRow = worksheet.addRow([
      '', '', '', '', '', '', '', '', 'DATE TOTAL', groupRoomsTotal, groupAmountTotal, ''
    ]);
    const subRowNumber = subtotalRow.number;
    worksheet.mergeCells(`A${subRowNumber}:I${subRowNumber}`);
    subtotalRow.height = 22;
    subtotalRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = borderThin;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: subtotalBg } };
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '111827' } };
    });
    subtotalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
    subtotalRow.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };
    subtotalRow.getCell(11).alignment = { horizontal: 'right', vertical: 'middle' };
    subtotalRow.getCell(11).numFmt = '₹#,##0';

    if (gIdx < groupKeys.length - 1) {
      worksheet.addRow([]);
    }
  });

  return runningTotalSl + 1;
}

/**
 * Builds "All Bookings" sheet: Grouped HOTEL-WISE first, and inside each hotel, DATE-WISE
 */
function buildAllBookingsHotelWiseSheet(worksheet, bookingList, properties = []) {
  applyWorksheetColumns(worksheet);

  if (!bookingList || bookingList.length === 0) {
    const emptyBanner = worksheet.addRow(['No bookings recorded across properties']);
    worksheet.mergeCells(`A${emptyBanner.number}:L${emptyBanner.number}`);
    emptyBanner.height = 30;
    emptyBanner.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    emptyBanner.getCell(1).font = { name: 'Arial', size: 10, italic: true, color: { argb: '6B7280' } };
    return;
  }

  // Group by Hotel Name
  const hotelGroups = {};
  bookingList.forEach(b => {
    let hotelName = b.hotelName;
    if (!hotelName && b.hotelId) {
      const match = properties.find(p => p.id === b.hotelId);
      if (match) hotelName = match.name;
    }
    hotelName = hotelName || 'Other Stays / Unassigned Hotel';

    if (!hotelGroups[hotelName]) {
      hotelGroups[hotelName] = [];
    }
    hotelGroups[hotelName].push(b);
  });

  let runningTotalSl = 1;
  const hotelNames = Object.keys(hotelGroups);

  hotelNames.forEach((hotelName, hIdx) => {
    const hotelBookings = hotelGroups[hotelName];
    const hotelRoomsTotal = hotelBookings.reduce((sum, b) => sum + (b.rooms || 1), 0);
    const hotelAmountTotal = hotelBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    // 1. Grand Hotel Header Banner (Merged A to L)
    const hotelBannerRow = worksheet.addRow([`🏨  ${hotelName.toUpperCase()}`, '', '', '', '', '', '', '', '', '', '', '']);
    const hBannerNum = hotelBannerRow.number;
    worksheet.mergeCells(`A${hBannerNum}:L${hBannerNum}`);
    hotelBannerRow.height = 28;
    hotelBannerRow.getCell(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    hotelBannerRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    hotelBannerRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hotelBannerBg } };
    for (let c = 1; c <= 12; c++) {
      hotelBannerRow.getCell(c).border = borderThin;
    }

    // 2. Build Date-grouped blocks inside this hotel
    runningTotalSl = buildDateGroupedBlocks(worksheet, hotelBookings, runningTotalSl);

    // 3. Hotel Summary Subtotal Row
    const hotelSubRow = worksheet.addRow([
      '', '', '', '', '', '', '', '', `${hotelName.toUpperCase()} — TOTAL`, hotelRoomsTotal, hotelAmountTotal, ''
    ]);
    const hSubNum = hotelSubRow.number;
    worksheet.mergeCells(`A${hSubNum}:I${hSubNum}`);
    hotelSubRow.height = 24;
    hotelSubRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = borderThin;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: hotelSubtotalBg } };
      cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: '102641' } };
    });
    hotelSubRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
    hotelSubRow.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };
    hotelSubRow.getCell(11).alignment = { horizontal: 'right', vertical: 'middle' };
    hotelSubRow.getCell(11).numFmt = '₹#,##0';

    if (hIdx < hotelNames.length - 1) {
      worksheet.addRow([]);
      worksheet.addRow([]);
    }
  });
}

/**
 * Helper to sanitize sheet names for Excel limits (max 31 chars, no invalid characters)
 */
function sanitizeSheetName(name, existingNames = new Set()) {
  let cleaned = name.replace(/[:\\/?*\[\]]/g, '').trim().substring(0, 31);
  if (!cleaned) cleaned = 'Sheet';
  let candidate = cleaned;
  let counter = 1;
  while (existingNames.has(candidate.toLowerCase())) {
    const suffix = `_${counter}`;
    candidate = cleaned.substring(0, 31 - suffix.length) + suffix;
    counter++;
  }
  existingNames.add(candidate.toLowerCase());
  return candidate;
}

/**
 * Exports hotel reservations into the exact requested layout:
 * 1. "All Bookings": Hotel-wise primary sections, and inside each hotel, Date-wise sections with subtitles & totals.
 * 2. Individual Hotel Tabs: Dedicated tab for each Hotel property (e.g. "Sabharwal Executive", "Sabharwal Palace").
 * 3. Individual Date Tabs: Dedicated tabs for specific dates (Yesterday, Today, and each upcoming date).
 */
export async function exportCorporateHotelExcel({ bookings = [], properties = [], rooms = [], filterHotel = 'all' }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sabharwal Hospitality';
  workbook.lastModifiedBy = 'Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Resolve hotel matching criteria
  let targetHotelId = filterHotel;
  let targetHotelName = filterHotel;
  if (filterHotel !== 'all') {
    const matchedProp = properties.find(p => p.id === filterHotel || p.name === filterHotel);
    if (matchedProp) {
      targetHotelId = matchedProp.id;
      targetHotelName = matchedProp.name;
    }
  }

  // Filter by selected hotel if not 'all'
  const hotelFiltered = bookings.filter(b => {
    if (filterHotel === 'all') return true;
    if (b.hotelId && (b.hotelId === targetHotelId || b.hotelId === targetHotelName)) return true;
    if (b.hotelName && (b.hotelName === targetHotelName || b.hotelName === targetHotelId)) return true;
    return false;
  });

  // Sort chronologically by check-in date
  const sortedBookings = [...hotelFiltered].sort((a, b) => {
    const da = a.checkIn ? new Date(a.checkIn).getTime() : 0;
    const db = b.checkIn ? new Date(b.checkIn).getTime() : 0;
    return da - db;
  });

  const existingSheetNames = new Set();

  // ========================================================
  // TAB 1: "All Bookings" (Hotel-Wise + Date-Wise inside)
  // ========================================================
  const wsAll = workbook.addWorksheet(sanitizeSheetName('All Bookings', existingSheetNames));
  buildAllBookingsHotelWiseSheet(wsAll, sortedBookings, properties);

  // ========================================================
  // SEPARATE HOTEL TABS: (Only when exporting all hotels or multiple properties)
  // ========================================================
  if (filterHotel === 'all') {
    const hotelMap = {};
    sortedBookings.forEach(b => {
      let hotelName = b.hotelName;
      if (!hotelName && b.hotelId) {
        const match = properties.find(p => p.id === b.hotelId);
        if (match) hotelName = match.name;
      }
      hotelName = hotelName || 'Unassigned Hotel';
      if (!hotelMap[hotelName]) hotelMap[hotelName] = [];
      hotelMap[hotelName].push(b);
    });

    Object.keys(hotelMap).forEach(hName => {
      const tabTitle = sanitizeSheetName(hName, existingSheetNames);
      const wsHotel = workbook.addWorksheet(tabTitle);
      applyWorksheetColumns(wsHotel);
      buildDateGroupedBlocks(wsHotel, hotelMap[hName], 1);
    });
  }

  // ========================================================
  // SEPARATE DATE TABS: Yesterday, Today, & Upcoming Dates
  // ========================================================
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = subDays(todayStart, 1);

  const yesterdayTabName = format(yesterdayStart, 'MMM d'); // e.g. "Oct 24"
  const todayTabName = format(todayStart, 'MMM d');         // e.g. "Oct 25"

  // Collect distinct dates
  const bookingsByDate = {};
  sortedBookings.forEach(b => {
    let dateKey;
    if (b.checkIn) {
      try {
        dateKey = format(parseISO(b.checkIn), 'MMM d');
      } catch (e) {
        dateKey = b.checkIn;
      }
    } else {
      dateKey = todayTabName;
    }

    if (!bookingsByDate[dateKey]) {
      bookingsByDate[dateKey] = [];
    }
    bookingsByDate[dateKey].push(b);
  });

  // 1. Yesterday Tab
  const yName = sanitizeSheetName(yesterdayTabName, existingSheetNames);
  const wsYesterday = workbook.addWorksheet(yName);
  applyWorksheetColumns(wsYesterday);
  buildDateGroupedBlocks(wsYesterday, bookingsByDate[yesterdayTabName] || [], 1);

  // 2. Today Tab
  const tName = sanitizeSheetName(todayTabName, existingSheetNames);
  const wsToday = workbook.addWorksheet(tName);
  applyWorksheetColumns(wsToday);
  buildDateGroupedBlocks(wsToday, bookingsByDate[todayTabName] || [], 1);

  // 3. Future Dates Tabs (Strictly after today)
  const futureDateMap = {};
  sortedBookings.forEach(b => {
    if (!b.checkIn) return;
    try {
      const bDate = startOfDay(parseISO(b.checkIn));
      if (bDate > todayStart) {
        const dKey = format(bDate, 'MMM d');
        if (!futureDateMap[dKey]) {
          futureDateMap[dKey] = {
            dateObj: bDate,
            list: []
          };
        }
        futureDateMap[dKey].list.push(b);
      }
    } catch (e) {}
  });

  const sortedFutureKeys = Object.keys(futureDateMap).sort((a, b) => {
    return futureDateMap[a].dateObj.getTime() - futureDateMap[b].dateObj.getTime();
  });

  sortedFutureKeys.forEach(fKey => {
    const fTabTitle = sanitizeSheetName(fKey, existingSheetNames);
    const wsFutureDate = workbook.addWorksheet(fTabTitle);
    applyWorksheetColumns(wsFutureDate);
    buildDateGroupedBlocks(wsFutureDate, futureDateMap[fKey].list, 1);
  });

  // Generate buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  let hotelNameResolved = filterHotel;
  if (filterHotel !== 'all') {
    const matchedProp = properties.find(p => p.id === filterHotel || p.name === filterHotel);
    if (matchedProp) {
      hotelNameResolved = matchedProp.name;
    }
  }
  const hotelTag = hotelNameResolved === 'all' ? 'All_Hotels' : hotelNameResolved.replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `Sabharwal_Hospitality_Report_${hotelTag}_${format(new Date(), 'dd-MMM-yyyy_HHmm')}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
