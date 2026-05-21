export type Money = {
	amount: number;
	currency: string;
};

export type StoreRole = 'owner' | 'manager' | 'cs_agent' | 'fulfillment';

export type Product = {
	id: number;
	storeId: string;
	categoryId: number | null;
	price: Money;
	compareAtPrice: Money | null;
	stock: number;
	sku: string | null;
	published: boolean;
	featured: boolean;
	variantCount: number;
	mediaUrls: string[];
	createdAt: string;
	updatedAt: string;
};

export type ProductVariant = {
	id: number;
	productId: number;
	sku: string | null;
	price: Money;
	compareAtPrice: Money | null;
	stock: number;
	options: Record<string, string>;
};

export type ProductCategory = {
	id: number;
	storeId: string;
	parentId: number | null;
	sortOrder: number;
};

export type InventoryLocation = {
	id: number;
	storeId: string;
	stock: number;
	reserved: number;
};

export type StockAdjustment = {
	id: number;
	productId: number;
	locationId: number;
	delta: number;
	reason: string;
	createdBy: string;
	createdAt: string;
};

export type OrderStatus =
	| 'pending'
	| 'confirmed'
	| 'processing'
	| 'shipped'
	| 'delivered'
	| 'cancelled'
	| 'refunded';

export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled' | 'returned';

export type Order = {
	id: number;
	storeId: string;
	customerId: number | null;
	guestEmail: string | null;
	status: OrderStatus;
	fulfillmentStatus: FulfillmentStatus;
	total: Money;
	subtotal: Money;
	shippingAmount: Money;
	taxAmount: Money;
	createdAt: string;
	updatedAt: string;
};

export type OrderItem = {
	id: number;
	orderId: number;
	productId: number;
	variantId: number | null;
	quantity: number;
	unitPrice: Money;
};

export type OrderEvent = {
	id: number;
	orderId: number;
	type: string;
	note: string | null;
	createdBy: string | null;
	createdAt: string;
};

export type FulfillmentItem = {
	orderItemId: number;
	quantity: number;
};

export type Return = {
	id: number;
	orderId: number;
	reason: string;
	status: 'requested' | 'approved' | 'received' | 'refunded' | 'rejected';
	createdAt: string;
};

export type CartItem = {
	productId: number;
	variantId: number | null;
	quantity: number;
	unitPrice: Money;
	mediaUrl: string | null;
};

export type Address = {
	firstName: string;
	lastName: string;
	company: string | null;
	line1: string;
	line2: string | null;
	city: string;
	state: string;
	postalCode: string;
	countryCode: string;
	phone: string | null;
};

export type PaymentMethod = {
	id: string;
	label: string;
	icon: string | null;
};

export type CollectionRuleField =
	| 'product.tag'
	| 'product.price'
	| 'product.inventory'
	| 'product.category';

export type CollectionRuleOperator =
	| 'equals'
	| 'not_equals'
	| 'contains'
	| 'starts_with'
	| 'ends_with'
	| 'greater_than'
	| 'less_than';

export type CollectionRule = {
	field: CollectionRuleField;
	operator: CollectionRuleOperator;
	value: string;
};

export type Collection = {
	id: number;
	storeId: string;
	ruleMode: 'all' | 'any' | null;
	rules: CollectionRule[];
};

export type EmailLog = {
	id: number;
	orderId: number | null;
	templateSlug: string;
	recipient: string;
	status: 'queued' | 'sent' | 'failed' | 'bounced';
	sentAt: string | null;
	createdAt: string;
};

export type ScheduledEdit = {
	id: number;
	storeId: string;
	targetType: 'product' | 'variant' | 'collection';
	targetId: number;
	field: string;
	value: unknown;
	scheduledAt: string;
	expiresAt: string | null;
	applied: boolean;
};

export type BulkEditField =
	| 'price'
	| 'compare_at_price'
	| 'stock'
	| 'published'
	| 'featured'
	| 'category';

export type BulkEditJob = {
	id: string;
	field: BulkEditField;
	value: unknown;
	productIds: number[];
	status: 'pending' | 'running' | 'done' | 'failed';
	successCount: number;
	failureCount: number;
	failures: { productId: number; reason: string }[];
	canUndo: boolean;
	createdAt: string;
};

export type DashboardPeriod = 'today' | 'mtd' | 'custom';

export type MetricSnapshot = {
	revenue: Money;
	orderCount: number;
	averageOrderValue: Money;
	newCustomerCount: number;
	period: DashboardPeriod;
	from: string;
	to: string;
};

export type SortDirection = 'asc' | 'desc';

export type SortState = {
	column: string;
	direction: SortDirection;
};

export type PageInfo = {
	page: number;
	pageSize: number;
	total: number;
};
