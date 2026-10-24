import ExcelJS from 'exceljs';
import { format, parseISO, isSameDay, subDays, startOfDay } from 'date-fns';

/**
 * Styles & fills matching the corporate spreadsheet reference:
 * - Top Date banner: Soft Sage Green (#C8E6C9)
 * - Section Headers:
 *   - Dark Green (#1E5631) for TOTAL SL, SN, PHONE NO, E-MAIL ID, DATE, TIME/SLOT, ROOM CATEGORY, ROOMS, AMOUNT, STATUS
 *   - Soft Pink (#E8B4B8) for ORDER NO and NAME
 * - Subtotal Row: Light Pastel Green (#F1F8E9) with bold counts and sums
 */
const headerBgDarkGreen = '1E5631';
const headerBgPink = 'E8B4B8';
const dateBannerBg = 'C8E6C9';
const subtotalBg = 'F1F8E9';
const borderThin = {
  top: { style: 'thin', color: { argb: 'D1D5DB' } },
  left: { style: 'thin', color: { argb: 'D1D5DB' } },
  bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
  right: { style: 'thin', color: { argb: 'D1D5DB' } }
};

/**
 * Helper to build a styled table on any given worksheet
 */
function buildReservationsSheet(worksheet, sheetTitle, bookingList, overallStartingSl = 1) {
  worksheet.views = [{ showGridLines: true }];

  worksheet.columns = [
    { key: 'totalSl', width: 12 },   // Col A: TOTAL SL
    { key: 'sn', width: 8 },         // Col B: SN
    { key: 'orderNo', width: 20 },    // Col C: ORDER NO
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

  if (!bookingList || bookingList.length === 0) {
    const emptyBanner = worksheet.addRow([`No bookings recorded for ${sheetTitle}`]);
    worksheet.mergeCells(`A${emptyBanner.number}:L${emptyBanner.number}`);
    emptyBanner.height = 30;
    emptyBanner.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    emptyBanner.getCell(1).font = { name: 'Arial', size: 10, italic: true, color: { argb: '6B7280' } };
    return overallStartingSl;
  }

  // Group bookings by check-in date
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
      // Format Order No cleanly: e.g. SBH-1001 or SH-1001 based on ID
      const orderCode = b.id ? (b.id.toString().startsWith('SBH') ? b.id : `SBH-${b.id.toString().padStart(4, '0')}`) : 'SBH-0001';

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

    // 4. Section Subtotal Row
    const subtotalRow = worksheet.addRow([
      '', '', '', '', '', '', '', '', 'TOTAL', groupRoomsTotal, groupAmountTotal, ''
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
 * Exports hotel reservations into configured multi-sheet corporate workbook:
 * 1. "All Bookings": Complete reservation history grouped by date
 * 2. "Yesterday": Orders / Stays from the previous day
 * 3. "Today": Orders / Stays for today's date
 * 4. "Future Dates": Separate sheet for all upcoming bookings (or by upcoming dates)
 */
export async function exportCorporateHotelExcel({ bookings = [], properties = [], rooms = [], filterHotel = 'all' }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sabharwal Hospitality';
  workbook.lastModifiedBy = 'Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Filter by hotel property if selected
  const hotelFiltered = bookings.filter(b => {
    if (filterHotel !== 'all' && b.hotelName !== filterHotel && b.hotelId !== filterHotel) {
      return false;
    }
    return true;
  });

  // Sort chronologically by check-in date
  const sortedBookings = [...hotelFiltered].sort((a, b) => {
    const da = a.checkIn ? new Date(a.checkIn).getTime() : 0;
    const db = b.checkIn ? new Date(b.checkIn).getTime() : 0;
    return da - db;
  });

  // Time boundaries
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = subDays(todayStart, 1);

  // Group into cohorts: Yesterday, Today, Future, and All
  const yesterdayBookings = [];
  const todayBookings = [];
  const futureBookings = [];

  sortedBookings.forEach(b => {
    if (!b.checkIn) {
      futureBookings.push(b);
      return;
    }
    const checkInDate = startOfDay(parseISO(b.checkIn));
    
    // Also consider creation/booked date if present
    const bookedAtDate = b.createdAt ? startOfDay(parseISO(b.createdAt)) : null;

    if (isSameDay(checkInDate, yesterdayStart) || (bookedAtDate && isSameDay(bookedAtDate, yesterdayStart))) {
      yesterdayBookings.push(b);
    } else if (isSameDay(checkInDate, todayStart) || (bookedAtDate && isSameDay(bookedAtDate, todayStart))) {
      todayBookings.push(b);
    } else if (checkInDate > todayStart) {
      futureBookings.push(b);
    }
  });

  // ========================================================
  // SHEET 1: ALL BOOKING
  // ========================================================
  const wsAll = workbook.addWorksheet('All Booking');
  buildReservationsSheet(wsAll, 'All Booking', sortedBookings);

  // ========================================================
  // SHEET 2: YESTERDAY (PREVIOUS DAY ORDERS)
  // ========================================================
  const yesterdayLabel = `Yesterday (${format(yesterdayStart, 'dd-MMM')})`;
  const wsYesterday = workbook.addWorksheet('Yesterday');
  buildReservationsSheet(wsYesterday, yesterdayLabel, yesterdayBookings);

  // ========================================================
  // SHEET 3: TODAY (TODAY'S DATE BOOKING)
  // ========================================================
  const todayLabel = `Today (${format(todayStart, 'dd-MMM')})`;
  const wsToday = workbook.addWorksheet('Today');
  buildReservationsSheet(wsToday, todayLabel, todayBookings);

  // ========================================================
  // SHEET 4+: FUTURE BOOKINGS
  // If there are future bookings, organize by date sheets or dedicated Upcoming sheet
  // ========================================================
  // Group future bookings by specific dates
  const futureDateGroups = {};
  futureBookings.forEach(b => {
    let key = 'Upcoming Stays';
    if (b.checkIn) {
      try {
        key = format(parseISO(b.checkIn), 'dd-MMM-yyyy');
      } catch (e) {
        key = b.checkIn;
      }
    }
    if (!futureDateGroups[key]) futureDateGroups[key] = [];
    futureDateGroups[key].push(b);
  });

  const futureDates = Object.keys(futureDateGroups);

  if (futureDates.length > 0) {
    // 4a. Master Future Bookings sheet
    const wsFuture = workbook.addWorksheet('Future Bookings');
    buildReservationsSheet(wsFuture, 'Future Bookings', futureBookings);

    // 4b. Individual date sheets for specific upcoming dates if multiple
    futureDates.forEach(dateStr => {
      // Clean sheet name: Excel allows max 31 chars and no / \ ? * : [ ]
      const safeSheetName = dateStr.replace(/[/\\?*:[\]]/g, '-').substring(0, 31);
      // Avoid naming collision with existing sheets
      if (!['All Booking', 'Yesterday', 'Today', 'Future Bookings'].includes(safeSheetName)) {
        const wsDate = workbook.addWorksheet(safeSheetName);
        buildReservationsSheet(wsDate, dateStr, futureDateGroups[dateStr]);
      }
    });
  } else {
    const wsFuture = workbook.addWorksheet('Future Bookings');
    buildReservationsSheet(wsFuture, 'Future Bookings', []);
  }

  // Generate buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const hotelTag = filterHotel === 'all' ? 'All_Hotels' : filterHotel.replace(/\s+/g, '_');
  a.download = `Sabharwal_Hospitality_Report_${hotelTag}_${format(new Date(), 'dd-MMM-yyyy_HHmm')}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
