export type StudentRegistrationPayload = {
  fullName: string;
  indexNumber: string;
  email: string;
  combination: string;
  academicYear: string;
  contactNumber: string;
  password: string;
};

export type LecturerRegistrationPayload = {
  lecturerId: string;
  department: string;
  fullName: string;
  email: string;
  contactNumber: string;
  password: string;
};

export type ProjectPayload = {
  department: string;
  title: string;
  type: 'individual' | 'group';
  description: string;
  aims: string;
  objectives: string;
  groupMembers?: string[];
};
