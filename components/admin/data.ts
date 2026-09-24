import {
  CreditCard,
  BarChart3,
  ShoppingCart,
  Package,
  Ticket,
  Users,
  Truck,
  Tags,
  Cake,
} from 'lucide-react';
import type { ComponentType } from 'react';

export type Status = 'pending' | 'contacted' | 'completed';

export interface LineItem {
  name: string;
  qty: number;
  price: number;
}

export interface OrderRequest {
  id: string;
  customer: string;
  phone: string;
  addressShort: string;
  addressFull: string;
  products: LineItem[];
  total: number;
  date: string; // ISO — used only for date-range filtering (post-interaction)
  dateLabel: string; // pre-formatted to avoid hydration mismatches
  timeLabel: string;
  status: Status;
}

export interface NavItem {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export const NAV: NavItem[] = [
  { key: 'billing', label: 'Billing', icon: CreditCard },
  { key: 'analytics', label: 'POS Analytics', icon: BarChart3 },
  { key: 'orders', label: 'Orders', icon: ShoppingCart },
  { key: 'inventory', label: 'Inventory', icon: Package },
  { key: 'categories', label: 'Categories', icon: Tags },
  { key: 'coupons', label: 'Coupons', icon: Ticket },
  { key: 'birthdays', label: 'Date of Birth', icon: Cake },
  { key: 'delivery', label: 'Delivery', icon: Truck },
  { key: 'users', label: 'Users', icon: Users },
];

export const REQUESTS: OrderRequest[] = [
  {
    id: 'ORD-2026-0006',
    customer: 'Aria Menon',
    phone: '9840123456',
    addressShort: '24, Beach Road…',
    addressFull: '24, Beach Road, Besant Nagar, Chennai 600041',
    products: [
      { name: 'Ribbed Knit Top', qty: 1, price: 3240 },
      { name: 'Wide-Leg Trouser', qty: 1, price: 4240 },
    ],
    total: 7480,
    date: '2026-08-18T10:22:00',
    dateLabel: '18 Aug 2026',
    timeLabel: '10:22 am',
    status: 'completed',
  },
  {
    id: 'ORD-2026-0005',
    customer: 'Devan Rao',
    phone: '9700456789',
    addressShort: '8, MG Road…',
    addressFull: '8, MG Road, Ashok Nagar, Bengaluru 560001',
    products: [{ name: 'Linen Overshirt', qty: 1, price: 2150 }],
    total: 2150,
    date: '2026-08-17T16:40:00',
    dateLabel: '17 Aug 2026',
    timeLabel: '04:40 pm',
    status: 'contacted',
  },
  {
    id: 'ORD-2026-0004',
    customer: 'Nisha Pillai',
    phone: '9962233445',
    addressShort: '17, Residency Rd…',
    addressFull: '17, Residency Road, R.S. Puram, Coimbatore 641018',
    products: [
      { name: 'Wool Overcoat', qty: 1, price: 8900 },
      { name: 'Cashmere Scarf', qty: 1, price: 2040 },
      { name: 'Leather Belt', qty: 1, price: 2000 },
    ],
    total: 12940,
    date: '2026-08-14T09:05:00',
    dateLabel: '14 Aug 2026',
    timeLabel: '09:05 am',
    status: 'contacted',
  },
  {
    id: 'ORD-2026-0003',
    customer: 'Karan Shah',
    phone: '9123456780',
    addressShort: '5, Linking Rd…',
    addressFull: '5, Linking Road, Bandra West, Mumbai 400050',
    products: [{ name: 'Silk Blouse', qty: 1, price: 4300 }],
    total: 4300,
    date: '2026-08-06T14:30:00',
    dateLabel: '06 Aug 2026',
    timeLabel: '02:30 pm',
    status: 'completed',
  },
  {
    id: 'ORD-2026-0002',
    customer: 'Cenexa Systems',
    phone: '8925306434',
    addressShort: 'anna street | Selected…',
    addressFull: '3, Anna Street, T. Nagar, Chennai 600017',
    products: [
      { name: 'Cotton Hoodie', qty: 1, price: 2193 },
      { name: 'Denim Jacket', qty: 1, price: 3500 },
    ],
    total: 5693,
    date: '2026-07-14T08:14:00',
    dateLabel: '14 Jul 2026',
    timeLabel: '08:14 am',
    status: 'pending',
  },
  {
    id: 'ORD-2026-0001',
    customer: 'Cenexa Systems',
    phone: '8925306434',
    addressShort: 'address',
    addressFull: 'No. 45, Gandhi Road, R.S. Puram, Coimbatore 641001',
    products: [{ name: 'Limited Edition Overcoat', qty: 1, price: 103476 }],
    total: 103476,
    date: '2026-07-14T07:57:00',
    dateLabel: '14 Jul 2026',
    timeLabel: '07:57 am',
    status: 'pending',
  },
];

export const inr = (n: number) => '₹' + n.toLocaleString('en-IN');
