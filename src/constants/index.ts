export const BLOOD_GROUPS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
] as const;

export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const USER_ROLES = ['donor', 'provider', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const URGENCY_LEVELS = ['Routine', 'Urgent', 'Critical'] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export const REQUEST_STATUS = [
  'Pending',
  'In Progress',
  'Fulfilled',
  'Cancelled',
] as const;
export type RequestStatus = (typeof REQUEST_STATUS)[number];

export const COMPONENT_TYPES = [
  'Whole Blood',
  'Red Blood Cells',
  'Platelets',
  'Plasma',
] as const;
export type ComponentType = (typeof COMPONENT_TYPES)[number];

export const BANGLADESH_DIVISIONS = [
  'Dhaka',
  'Chattogram',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Sylhet',
  'Rangpur',
  'Mymensingh',
] as const;
