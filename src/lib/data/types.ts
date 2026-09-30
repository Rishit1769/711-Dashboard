export type EnquiryType = "Room" | "Buffet" | "Offer" | "Service" | "Event" | "General";

export const ENQUIRY_TYPES: EnquiryType[] = [
  "Room",
  "Buffet",
  "Offer",
  "Service",
  "Event",
  "General",
];

export type EnquiryStatus =
  | "New"
  | "Follow-up Required"
  | "Pending"
  | "Escalated"
  | "Closed"
  | "Converted";

export const ENQUIRY_STATUSES: EnquiryStatus[] = [
  "New",
  "Follow-up Required",
  "Pending",
  "Escalated",
  "Closed",
  "Converted",
];

export type Priority = "High" | "Medium" | "Low";

/** Only set when the workflow actually captured a booking outcome. */
export type ConversionStatus =
  | "Interested"
  | "Enquiry"
  | "Follow-up"
  | "Booked"
  | "Not Converted"
  | null;

export interface Customer {
  id: string;
  name: string;
  whatsapp: string;
  firstInteractionAt: string;
  lastInteractionAt: string;
  /** null when identity could not be matched technically. */
  isReturning: boolean | null;
  interests: string[];
}

export interface Enquiry {
  id: string;
  customerId: string;
  type: EnquiryType;
  createdAt: string;
  lastInteractionAt: string;
  status: EnquiryStatus;
  followUpRequired: boolean;
  followUpDueAt: string | null;
  assignedTo: string;
  source: "WhatsApp";
  priority: Priority;
  lastMessage: string;
  offerId: string | null;
  roomType: string | null;
  serviceCategory: string | null;
  buffetDate: string | null;
  guests: number | null;
  conversionStatus: ConversionStatus;
}

export type MessageAuthor = "customer" | "ai" | "human";
export type DeliveryStatus = "delivered" | "read" | "failed" | "received";

export interface Message {
  id: string;
  enquiryId: string;
  customerId: string;
  at: string;
  author: MessageAuthor;
  delivery: DeliveryStatus;
  escalation: boolean;
  promotional: boolean;
  offerId: string | null;
  text: string;
}

export interface Offer {
  id: string;
  name: string;
  segment: "All guests" | "Members" | "Corporate" | "Families";
  validFrom: string;
  validTo: string;
}

export interface Dataset {
  customers: Customer[];
  enquiries: Enquiry[];
  messages: Message[];
  offers: Offer[];
  staff: string[];
}
