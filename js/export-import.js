// Contact Export (CSV/JSON) and Import

export function exportContactsToCSV(contacts) {
  if (!contacts || contacts.length === 0) {
    alert('डाऊनलोड करण्यासाठी कोणत्याही नोंदी उपलब्ध नाहीत.');
    return;
  }

  const headers = ['नाव (Name)', 'जन्मतारीख (DOB)', 'जन्मवेळ (Time)', 'जन्मस्थळ (Place)', 'मोबाईल (Mobile)', 'वर्गवारी (Category)', 'नोंदी (Notes)'];
  
  const rows = contacts.map(c => [
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${c.dob || ''}"`,
    `"${c.birthTime || ''}"`,
    `"${(c.birthPlace || '').replace(/"/g, '""')}"`,
    `"${c.mobile || ''}"`,
    `"${c.category || ''}"`,
    `"${(c.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `DOB_Contacts_Backup_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportContactsToJSON(contacts) {
  const jsonContent = JSON.stringify(contacts, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `DOB_Backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseCSVContacts(csvText) {
  const lines = csvText.split(/\r\n|\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const contacts = [];
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV parser supporting quotes
    const values = [];
    let inQuotes = false;
    let currentValue = '';

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    if (values.length >= 2 && values[0] && values[1]) {
      contacts.push({
        name: values[0].replace(/^"|"$/g, ''),
        dob: values[1].replace(/^"|"$/g, ''),
        birthTime: values[2] ? values[2].replace(/^"|"$/g, '') : '',
        birthPlace: values[3] ? values[3].replace(/^"|"$/g, '') : '',
        mobile: values[4] ? values[4].replace(/^"|"$/g, '') : '',
        category: values[5] ? values[5].replace(/^"|"$/g, '') : 'इतर',
        notes: values[6] ? values[6].replace(/^"|"$/g, '') : ''
      });
    }
  }
  return contacts;
}
