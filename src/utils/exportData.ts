import { Contact, QualifyingQuestion, CustomContactField } from '@/types/contact';

export function exportToCSV(
  contacts: Contact[], 
  questions: QualifyingQuestion[],
  customFields: CustomContactField[] = []
): void {
  const activeCustomFields = customFields.filter(f => !f.isArchived).sort((a, b) => a.order - b.order);
  
  const headers = [
    'First Name',
    'Last Name',
    'Company',
    'Job Title',
    'Phone',
    'Email',
    'Website',
    'Notes',
    'Status',
    'Callback Date',
    'Completed Reason',
    'Not Interested Reason',
    'Appointment Date',
    'Created At',
    'Last Called At',
    ...activeCustomFields.map(f => f.label),
    ...questions.filter(q => !q.isArchived).map(q => q.label),
  ];

  const rows = contacts.map(contact => [
    contact.firstName,
    contact.lastName,
    contact.company,
    contact.jobTitle,
    contact.phone,
    contact.email,
    contact.website,
    contact.notes,
    contact.status,
    contact.callbackDate ? new Date(contact.callbackDate).toISOString() : '',
    contact.completedReason || '',
    contact.notInterestedReason || '',
    contact.appointmentDate ? new Date(contact.appointmentDate).toISOString() : '',
    contact.createdAt ? new Date(contact.createdAt).toISOString() : '',
    contact.lastCalledAt ? new Date(contact.lastCalledAt).toISOString() : '',
    ...activeCustomFields.map(f => {
      const value = contact.customFields?.[f.id];
      if (Array.isArray(value)) return value.join('; ');
      return value ?? '';
    }),
    ...questions.filter(q => !q.isArchived).map(q => {
      const answer = contact.qualifyingAnswers?.[q.id];
      if (Array.isArray(answer)) return answer.join('; ');
      return answer ?? '';
    }),
  ]);

  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  downloadFile(csvContent, 'contacts-export.csv', 'text/csv');
}

export function exportToJSON(contacts: Contact[], questions: QualifyingQuestion[]): void {
  const data = {
    exportedAt: new Date().toISOString(),
    questions: questions,
    contacts: contacts,
  };

  downloadFile(JSON.stringify(data, null, 2), 'contacts-export.json', 'application/json');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
