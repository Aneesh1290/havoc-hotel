import ExcelJS from 'exceljs';
import { format, parseISO } from 'date-fns';

/**
 * Exports hotel reservations into a formatted Excel sheet mirroring the corporate format:
 * - Top Date banner row per date section (Light Green #D8EAD4 fill, bold centered)
 * - Headers:
 *   - Dark Green (#2E7D32) with white text for TOTAL SL, SN, PHONE NO, E-MAIL ID, DATE, TIME/SLOT, ROOM/SIM, AMT
 *   - Soft Pink (#E8B4B8) with dark text for ORDER NO (BOOKING ID), NAME
 * - Data Rows:
 *   - Thin border (#CCCCCC) on all cells
 *   - Centered alignment on numbers and dates, left alignment on names & emails
 * - Section TOTAL Row:
 *   - Merged "TOTAL" cell bold with sum of rooms/amount
 * - Formatted Revenue Summary & Room Inventory sheets
 */
export async function exportCorporateHotelExcel({ bookings = [], properties = [], rooms = [], filterHotel = 'all', filterDate = 'all' }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sabharwal Hospitality';
  workbook.lastModifiedBy = 'Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Filter bookings
  const filteredBookings = bookings.filter(b => {
    if (filterHotel !== 'all' && b.hotelName !== filterHotel && b.hotelId !== filterHotel) {
      return false;
    }
    if (filterDate !== 'all' && b.checkIn) {
      const bDate = parseISO(b.checkIn);
      const now = new Date();
      if (filterDate === 'this_month') {
        if (bDate.getMonth() !== now.getMonth() || bDate.getFullYear() !== now.getFullYear()) return false;
      } else if (filterDate === 'last_month') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        if (bDate.getMonth() !== lastMonth || bDate.getFullYear() !== lastMonthYear) return false;
      } else if (filterDate === 'this_year') {
        if (bDate.getFullYear() !== now.getFullYear()) return false;
      }
    }
    return true;
  });

  // Sort bookings by check-in date
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const da = a.checkIn ? new Date(a.checkIn).getTime() : 0;
    const db = b.checkIn ? new Date(b.checkIn).getTime() : 0;
    return da - db;
  });

  // ==========================================
  // SHEET 1: RESERVATIONS BY DATE (CUSTOM FORMAT)
  // ==========================================
  const wsReservations = workbook.addWorksheet('Daily Reservations', {
    views: [{ showGridLines: true }]
  });

  // Column definitions & widths
  wsReservations.columns = [
    { key: 'totalSl', width: 12 },   // Col A: TOTAL SL
    { key: 'sn', width: 8 },         // Col B: SN
    { key: 'orderNo', width: 22 },    // Col C: ORDER NO
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

  // Group bookings by check-in date (Formatted: e.g. "Oct 24 (Sat)")
  const dateGroups = {};
  sortedBookings.forEach(b => {
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

  let runningTotalSl = 0;

  const headerBgDarkGreen = '1E5631'; // Forest green header matching reference
  const headerBgPink = 'E8B4B8';      // Dusty pink header matching reference
  const dateBannerBg = 'C8E6C9';      // Soft sage green banner
  const subtotalBg = 'F1F8E9';        // Very light green for totals
  const borderThin = {
    top: { style: 'thin', color: { argb: 'D1D5DB' } },
    left: { style: 'thin', color: { argb: 'D1D5DB' } },
    bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
    right: { style: 'thin', color: { argb: 'D1D5DB' } }
  };

  const groupKeys = Object.keys(dateGroups);

  if (groupKeys.length === 0) {
    // Empty state
    const emptyRow = wsReservations.addRow(['No reservations found for the selected criteria']);
    emptyRow.font = { italic: true, color: { argb: '6B7280' } };
  }

  groupKeys.forEach((dateKey, gIdx) => {
    const groupBookings = dateGroups[dateKey];

    // 1. Top Date Banner Row (Merged across Cols A-L)
    const bannerRow = wsReservations.addRow([
      dateKey, '', '', '', '', '', '', '', '', '', '', ''
    ]);
    const bannerRowNumber = bannerRow.number;
    wsReservations.mergeCells(`A${bannerRowNumber}:L${bannerRowNumber}`);
    
    bannerRow.height = 24;
    bannerRow.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: '111827' } };
    bannerRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    bannerRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: dateBannerBg }
    };
    for (let c = 1; c <= 12; c++) {
      bannerRow.getCell(c).border = borderThin;
    }

    // 2. Section Header Row
    const headerRow = wsReservations.addRow([
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
      
      // Order No (Col 3) & Name (Col 4) are Pink, others are Dark Green
      if (colNumber === 3 || colNumber === 4) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: headerBgPink }
        };
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '111827' } };
      } else {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: headerBgDarkGreen }
        };
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFF' } };
      }
    });

    let groupRoomsTotal = 0;
    let groupAmountTotal = 0;

    // 3. Data Rows for this Date
    groupBookings.forEach((b, itemIdx) => {
      runningTotalSl += 1;
      const sn = itemIdx + 1;
      const roomsCount = b.rooms || 1;
      const amt = b.amount || 0;
      groupRoomsTotal += roomsCount;
      groupAmountTotal += amt;

      const stayTime = b.stayDuration || (b.roomName?.toLowerCase().includes('12') ? '12 Hours' : '24 Hours');
      const orderCode = b.id ? `PAYDUE_SP_${b.id.toString().substring(0, 6).toUpperCase()}` : 'PAYDUE_SP';

      const dataRow = wsReservations.addRow([
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
        
        // Col D (Name) & Col F (Email) & Col I (Room) are left aligned
        if (colNumber === 4 || colNumber === 6 || colNumber === 9) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        } else if (colNumber === 11) {
          // Amount
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '₹#,##0';
        } else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    // 4. Subtotal Row (Columns A to I merged as "TOTAL", Col J is rooms sum, Col K is amount sum)
    const subtotalRow = wsReservations.addRow([
      '', '', '', '', '', '', '', '', 'TOTAL', groupRoomsTotal, groupAmountTotal, ''
    ]);
    const subRowNumber = subtotalRow.number;
    wsReservations.mergeCells(`A${subRowNumber}:I${subRowNumber}`);

    subtotalRow.height = 22;
    subtotalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = borderThin;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: subtotalBg }
      };
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '111827' } };
    });

    subtotalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
    subtotalRow.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };
    subtotalRow.getCell(11).alignment = { horizontal: 'right', vertical: 'middle' };
    subtotalRow.getCell(11).numFmt = '₹#,##0';

    // Blank row separator before next group
    if (gIdx < groupKeys.length - 1) {
      wsReservations.addRow([]);
    }
  });

  // ==========================================
  // SHEET 2: REVENUE BY HOTEL
  // ==========================================
  const wsRevenue = workbook.addWorksheet('Revenue by Hotel', {
    views: [{ showGridLines: true }]
  });

  wsRevenue.columns = [
    { key: 'sn', width: 8 },
    { key: 'hotel', width: 34 },
    { key: 'confirmed', width: 20 },
    { key: 'revenue', width: 24 },
    { key: 'share', width: 16 }
  ];

  // Revenue Header
  const revHeader = wsRevenue.addRow(['S.NO', 'HOTEL PROPERTY', 'CONFIRMED BOOKINGS', 'TOTAL REVENUE (₹)', 'SHARE (%)']);
  revHeader.height = 26;
  revHeader.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBgDarkGreen } };
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = borderThin;
  });

  const hotelStats = {};
  properties.forEach(p => {
    hotelStats[p.name] = { bookings: 0, revenue: 0 };
  });

  let grandRev = 0;
  let grandBookings = 0;

  filteredBookings.forEach(b => {
    if (b.status === 'Confirmed' || b.status === 'Checked In' || b.status === 'Completed') {
      const name = b.hotelName || 'Sabharwal Residency';
      if (!hotelStats[name]) hotelStats[name] = { bookings: 0, revenue: 0 };
      hotelStats[name].bookings += 1;
      hotelStats[name].revenue += (b.amount || 0);
      grandRev += (b.amount || 0);
      grandBookings += 1;
    }
  });

  let propIdx = 0;
  Object.keys(hotelStats).forEach((hName) => {
    propIdx++;
    const data = hotelStats[hName];
    const share = grandRev > 0 ? ((data.revenue / grandRev) * 100).toFixed(1) + '%' : '0%';
    const r = wsRevenue.addRow([propIdx, hName, data.bookings, data.revenue, share]);
    r.height = 22;
    r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
    r.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    r.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
    r.getCell(4).numFmt = '₹#,##0';
    r.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    r.eachCell(c => c.border = borderThin);
  });

  // Grand Total Row
  const grandRow = wsRevenue.addRow(['', 'GRAND TOTAL', grandBookings, grandRev, '100%']);
  grandRow.height = 24;
  grandRow.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: subtotalBg } };
    c.font = { name: 'Arial', size: 9, bold: true };
    c.border = borderThin;
  });
  grandRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
  grandRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
  grandRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
  grandRow.getCell(4).numFmt = '₹#,##0';
  grandRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };

  // ==========================================
  // SHEET 3: ROOM INVENTORY CATALOG
  // ==========================================
  if (rooms && rooms.length > 0) {
    const wsInventory = workbook.addWorksheet('Room Inventory', { views: [{ showGridLines: true }] });
    wsInventory.columns = [
      { key: 'sn', width: 8 },
      { key: 'hotel', width: 32 },
      { key: 'room', width: 34 },
      { key: 'category', width: 18 },
      { key: 'price', width: 18 },
      { key: 'capacity', width: 14 },
      { key: 'totalUnits', width: 16 }
    ];

    const invHeader = wsInventory.addRow(['S.NO', 'HOTEL PROPERTY', 'ROOM TYPE NAME', 'CATEGORY', 'PRICE / NIGHT', 'CAPACITY', 'TOTAL UNITS']);
    invHeader.height = 26;
    invHeader.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerBgDarkGreen } };
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = borderThin;
    });

    rooms.forEach((r, idx) => {
      const prop = properties.find(p => p.id === r.propertyId);
      const row = wsInventory.addRow([
        idx + 1,
        prop?.name || 'Sabharwal Residency',
        r.name,
        r.type || 'Standard',
        r.pricePerNight,
        `${r.capacity} Guests`,
        r.totalUnits || 0
      ]);
      row.height = 20;
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
      row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
      row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(5).numFmt = '₹#,##0';
      row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
      row.eachCell(c => c.border = borderThin);
    });
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
