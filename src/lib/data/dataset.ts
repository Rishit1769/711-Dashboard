import type {
  ConversionStatus,
  Customer,
  Dataset,
  Enquiry,
  EnquiryStatus,
  EnquiryType,
  Message,
  Offer,
  Priority,
} from "./types";

/**
 * Deterministic mock dataset for the 711 Club analytics dashboard.
 *
 * Every KPI in the UI is computed from these records (see analytics.ts), so the
 * numbers are always internally consistent. Replacing this module with a real
 * API/database call is the only change needed to go live.
 */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(711711);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)] as T;
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const chance = (p: number) => rand() < p;

const FIRST = [
  "Aarav", "Isha", "Rohan", "Meera", "Kabir", "Ananya", "Devansh", "Priya", "Vikram", "Sneha",
  "Arjun", "Tara", "Nikhil", "Riya", "Karan", "Nandini", "Siddharth", "Aditi", "Manav", "Kavya",
  "Rahul", "Diya", "Yash", "Pooja", "Imran", "Zoya", "Aditya", "Neha", "Varun", "Simran",
];
const LAST = [
  "Sharma", "Verma", "Iyer", "Nair", "Kapoor", "Mehta", "Reddy", "Chopra", "Bose", "Malhotra",
  "Sethi", "Rao", "Joshi", "Gill", "Khan", "Dutta", "Pillai", "Bhatt", "Saxena", "Menon",
];

const STAFF = ["Ritika Menon", "Arun Pillai", "Sameer Kaul", "Divya Nambiar", "Faisal Ahmed"];

const INTERESTS = [
  "Rooms", "Buffet", "Events", "Dining", "Offers", "Services", "Special occasions",
  "Poolside", "Banquets", "Corporate stays",
];

const ROOM_TYPES = ["Standard Room", "Deluxe Room", "Executive Suite", "Club Suite", "Family Room"];
const SERVICE_CATEGORIES = [
  "Restaurant", "Buffet", "Events", "Facilities", "Check-in / Check-out", "General hotel services",
];

const OFFERS: Offer[] = [
  { id: "off-1", name: "Weekend Buffet 2+1", segment: "Families", validFrom: "2026-05-01", validTo: "2026-09-30" },
  { id: "off-2", name: "Monsoon Staycation 20% Off", segment: "All guests", validFrom: "2026-06-01", validTo: "2026-09-15" },
  { id: "off-3", name: "Club Members Happy Hours", segment: "Members", validFrom: "2026-04-01", validTo: "2026-12-31" },
  { id: "off-4", name: "Corporate Long-Stay Package", segment: "Corporate", validFrom: "2026-05-15", validTo: "2026-11-30" },
  { id: "off-5", name: "Anniversary Dinner Special", segment: "All guests", validFrom: "2026-07-01", validTo: "2026-10-31" },
];

const CUSTOMER_LINES: Record<EnquiryType, string[]> = {
  Room: [
    "Do you have a deluxe room available this weekend?",
    "What is the tariff for two nights with breakfast?",
    "Is early check-in possible on Friday?",
  ],
  Buffet: [
    "What's on the weekly buffet menu this Sunday?",
    "Can we book the buffet for 8 people?",
    "Is the buffet price per head inclusive of taxes?",
  ],
  Offer: [
    "Is the monsoon staycation offer still valid?",
    "How do I claim the 2+1 buffet offer?",
    "Can the members' offer be combined with a room booking?",
  ],
  Service: [
    "Do you have airport pickup service?",
    "Is the pool open for non-resident guests?",
    "What time does the restaurant close?",
  ],
  Event: [
    "Looking for a banquet hall for 120 guests.",
    "Do you host anniversary parties with décor?",
    "Can we get a quote for a corporate offsite?",
  ],
  General: [
    "What are your opening hours?",
    "Where exactly is the club located?",
    "Do you allow guest passes on weekends?",
  ],
};

const AI_LINES = [
  "Sure! Sharing the details along with today's availability.",
  "Here's our current tariff sheet — would you like me to hold a slot?",
  "Our weekly buffet runs Friday to Sunday, 12:30–15:30. Shall I note your preferred date?",
  "I've noted your requirement. A team member will confirm shortly.",
];
const HUMAN_LINES = [
  "This is Ritika from 711 Club — I've blocked the slot for you.",
  "Confirming your booking request with the front desk now.",
  "Happy to customise the package for your group size.",
];

const DAYS = 120;
const NOW = new Date("2026-09-07T09:00:00.000Z");

function dayStart(offsetDays: number) {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() - offsetDays);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function withinDay(offsetDays: number) {
  const d = dayStart(offsetDays);
  d.setUTCHours(int(8, 22), int(0, 59), int(0, 59), 0);
  return d;
}

/** Weekend + recent-growth weighting so trends look like a real business. */
function dayWeight(offsetDays: number) {
  const d = dayStart(offsetDays);
  const dow = d.getUTCDay();
  const weekend = dow === 0 || dow === 5 || dow === 6 ? 1.6 : 1;
  const growth = 1 + (DAYS - offsetDays) / DAYS * 0.7;
  return weekend * growth;
}

function buildDataset(): Dataset {
  const customers: Customer[] = [];
  const enquiries: Enquiry[] = [];
  const messages: Message[] = [];

  const totalCustomers = 420;
  for (let i = 0; i < totalCustomers; i++) {
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    const first = withinDay(int(0, DAYS));
    const interests = Array.from(
      new Set(Array.from({ length: int(1, 3) }, () => pick(INTERESTS))),
    );
    customers.push({
      id: `cus-${i + 1}`,
      name,
      whatsapp: `+91 9${int(10, 99)}${int(10000, 99999)}${int(10, 99)}`,
      firstInteractionAt: first.toISOString(),
      lastInteractionAt: first.toISOString(),
      // A small share of contacts cannot be matched to a prior identity.
      isReturning: false,
      interests,
    });
  }

  const typeWeights: [EnquiryType, number][] = [
    ["Room", 30], ["Buffet", 26], ["Offer", 15], ["Service", 12], ["Event", 8], ["General", 9],
  ];
  const typePool: EnquiryType[] = typeWeights.flatMap(([t, w]) => Array.from({ length: w }, () => t));

  const statusPool: EnquiryStatus[] = [
    ...Array.from({ length: 18 }, () => "New" as EnquiryStatus),
    ...Array.from({ length: 20 }, () => "Follow-up Required" as EnquiryStatus),
    ...Array.from({ length: 22 }, () => "Pending" as EnquiryStatus),
    ...Array.from({ length: 9 }, () => "Escalated" as EnquiryStatus),
    ...Array.from({ length: 17 }, () => "Closed" as EnquiryStatus),
    ...Array.from({ length: 14 }, () => "Converted" as EnquiryStatus),
  ];

  let eId = 0;
  let mId = 0;
  const activeList: Customer[] = [];
  let nextNew = 0;

  for (let offset = DAYS; offset >= 0; offset--) {
    const count = Math.round(int(2, 5) * dayWeight(offset));
    for (let k = 0; k < count; k++) {
      const createdAt = withinDay(offset);
      // Either a brand-new contact reaches out, or an existing one returns.
      let customer: Customer;
      if (nextNew < customers.length && (activeList.length === 0 || chance(0.36))) {
        customer = customers[nextNew++]!;
        customer.firstInteractionAt = createdAt.toISOString();
        customer.lastInteractionAt = createdAt.toISOString();
        activeList.push(customer);
      } else {
        customer = activeList[int(0, activeList.length - 1)]!;
      }
      const type = pick(typePool);
      const status = offset < 4 && chance(0.6) ? "New" : pick(statusPool);
      const followUpRequired =
        status === "Follow-up Required" || (status === "Pending" && chance(0.35));
      const priority: Priority =
        status === "Escalated" ? "High" : followUpRequired ? (chance(0.4) ? "High" : "Medium") : pick(["Low", "Medium"] as Priority[]);

      // Conversion is only captured for booking-capable workflows.
      let conversionStatus: ConversionStatus = null;
      if (type === "Room" || type === "Buffet" || type === "Offer" || type === "Event") {
        if (status === "Converted") conversionStatus = "Booked";
        else if (status === "Closed") conversionStatus = chance(0.55) ? "Not Converted" : null;
        else if (status === "Follow-up Required") conversionStatus = "Follow-up";
        else if (chance(0.5)) conversionStatus = chance(0.5) ? "Interested" : "Enquiry";
      }

      const id = `enq-${++eId}`;
      const enquiry: Enquiry = {
        id,
        customerId: customer.id,
        type,
        createdAt: createdAt.toISOString(),
        lastInteractionAt: createdAt.toISOString(),
        status,
        followUpRequired,
        followUpDueAt: followUpRequired
          ? new Date(createdAt.getTime() + int(-2, 4) * 86400000).toISOString()
          : null,
        assignedTo: status === "New" && chance(0.5) ? "Unassigned" : pick(STAFF),
        source: "WhatsApp",
        priority,
        lastMessage: pick(CUSTOMER_LINES[type]),
        offerId: type === "Offer" ? pick(OFFERS).id : chance(0.18) ? pick(OFFERS).id : null,
        roomType: type === "Room" ? pick(ROOM_TYPES) : null,
        serviceCategory: type === "Service" ? pick(SERVICE_CATEGORIES) : null,
        buffetDate:
          type === "Buffet"
            ? new Date(createdAt.getTime() + int(1, 12) * 86400000).toISOString()
            : null,
        guests: type === "Buffet" || type === "Event" ? pick([2, 2, 3, 4, 4, 5, 6, 8, 10, 12, 18, 25]) : null,
      conversionStatus,
      };

      // Conversation thread: customer messages, AI replies, occasional human takeover.
      const turns = int(1, 5);
      let cursor = createdAt.getTime();
      const escalated = status === "Escalated" || chance(0.12);
      for (let t = 0; t < turns; t++) {
        cursor += int(2, 40) * 60000;
        messages.push({
          id: `msg-${++mId}`,
          enquiryId: id,
          customerId: customer.id,
          at: new Date(cursor).toISOString(),
          author: "customer",
          delivery: "received",
          escalation: false,
          promotional: false,
          offerId: null,
          text: t === 0 ? enquiry.lastMessage : pick(CUSTOMER_LINES[type]),
        });
        cursor += int(1, 6) * 60000;
        const humanTurn = escalated && t >= turns - 2;
        const failed = chance(0.035);
        messages.push({
          id: `msg-${++mId}`,
          enquiryId: id,
          customerId: customer.id,
          at: new Date(cursor).toISOString(),
          author: humanTurn ? "human" : "ai",
          delivery: failed ? "failed" : chance(0.7) ? "read" : "delivered",
          escalation: humanTurn && t === turns - 2,
          promotional: false,
          offerId: null,
          text: humanTurn ? pick(HUMAN_LINES) : pick(AI_LINES),
        });
      }

      // Promotional broadcast attached to the offer, where one exists.
      if (enquiry.offerId && chance(0.75)) {
        const sentAt = new Date(createdAt.getTime() - int(1, 5) * 86400000);
        messages.push({
          id: `msg-${++mId}`,
          enquiryId: id,
          customerId: customer.id,
          at: sentAt.toISOString(),
          author: "ai",
          delivery: chance(0.05) ? "failed" : "delivered",
          escalation: false,
          promotional: true,
          offerId: enquiry.offerId,
          text: `Offer update: ${OFFERS.find((o) => o.id === enquiry.offerId)?.name}`,
        });
      }

      enquiry.lastInteractionAt = new Date(cursor).toISOString();
      if (new Date(enquiry.lastInteractionAt) > new Date(customer.lastInteractionAt)) {
        customer.lastInteractionAt = enquiry.lastInteractionAt;
      }
      enquiries.push(enquiry);
    }
  }

  // Drop contacts that never produced an enquiry — keeps counts consistent.
  // Returning status is derived from matched repeat activity; a small share of
  // contacts cannot be matched at all and stay Unknown.
  const enquiryCount = new Map<string, number>();
  enquiries.forEach((e) => enquiryCount.set(e.customerId, (enquiryCount.get(e.customerId) ?? 0) + 1));
  customers.forEach((c) => {
    c.isReturning = chance(0.07) ? null : (enquiryCount.get(c.id) ?? 0) > 1;
  });

  const active = new Set(enquiries.map((e) => e.customerId));
  return {
    customers: customers.filter((c) => active.has(c.id)),
    enquiries,
    messages,
    offers: OFFERS,
    staff: STAFF,
  };
}

let cached: Dataset | null = null;

export function getDataset(): Dataset {
  if (!cached) cached = buildDataset();
  return cached;
}

export const REFERENCE_NOW = NOW;
export { STAFF, SERVICE_CATEGORIES, ROOM_TYPES };
