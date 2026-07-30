import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  type AdjustInventoryDto,
  type BrandDto,
  type ComplexCategoryDto,
  type ComplexProductDto,
  ComplexProductStatus,
  type CreateComplexProductDto,
  type CursorProductQueryDto,
  type InventoryItemDto,
  type UpdateComplexProductDto,
  type WarehouseDto,
} from "./dto/catalog.dto";
import {
  type ComplexOrderDto,
  ComplexOrderStatus,
  type CreateComplexOrderDto,
  type CreateReviewDto,
  type CustomerDto,
  type CustomerQueryDto,
  type OrderCursorQueryDto,
  type PaymentDto,
  type PromotionDto,
  type ReviewDto,
} from "./dto/commerce.dto";
import {
  type ChatMessageDto,
  type ConversationDto,
  type SendMessageDto,
} from "./dto/chat.dto";
import {
  ComplexRole,
  type ComplexUserDto,
  type MemberDto,
  type OrganizationDto,
  OrganizationPlan,
} from "./dto/identity.dto";
import {
  type AuditEventDto,
  type AuditQueryDto,
  type FileMetadataDto,
  type JobDto,
  JobStatus,
  type NotificationDto,
  NotificationKind,
} from "./dto/operations.dto";

interface ComplexUserRecord extends ComplexUserDto {
  password: string;
}

interface TenantNotification extends NotificationDto {
  organizationId: string;
}

interface TenantFile extends FileMetadataDto {
  organizationId: string;
}

interface TenantAuditEvent extends AuditEventDto {
  organizationId: string;
}

interface TenantJob extends JobDto {
  organizationId: string;
  startedAtMs: number;
}

interface TenantReview extends ReviewDto {
  organizationId: string;
}

@Injectable()
export class ComplexStore {
  private users: ComplexUserRecord[] = [];
  private organizations: OrganizationDto[] = [];
  private members: MemberDto[] = [];
  private products: ComplexProductDto[] = [];
  private categories: ComplexCategoryDto[] = [];
  private brands: BrandDto[] = [];
  private warehouses: WarehouseDto[] = [];
  private inventory: InventoryItemDto[] = [];
  private customers: CustomerDto[] = [];
  private orders: ComplexOrderDto[] = [];
  private payments: PaymentDto[] = [];
  private promotions: PromotionDto[] = [];
  private reviews: TenantReview[] = [];
  private notifications: TenantNotification[] = [];
  private files: TenantFile[] = [];
  private fileContents = new Map<string, Buffer>();
  private auditEvents: TenantAuditEvent[] = [];
  private jobs: TenantJob[] = [];
  private conversations: ConversationDto[] = [];
  private messages: ChatMessageDto[] = [];
  private orderIdempotency = new Map<string, string>();
  private sequences = {
    product: 20,
    order: 20,
    review: 20,
    file: 20,
    audit: 20,
    job: 20,
    message: 20,
  };

  constructor() {
    this.reset("small");
  }

  reset(preset: "small" | "large" = "small"): void {
    this.users = [
      {
        id: "complex-user-admin",
        email: "admin@complex.demo",
        password: "demo1234",
        name: "Complex Admin",
        role: ComplexRole.Admin,
        avatarUrl: "https://i.pravatar.cc/160?img=20",
        organizationIds: ["org-acme", "org-globex"],
      },
      {
        id: "complex-user-manager",
        email: "manager@complex.demo",
        password: "demo1234",
        name: "Complex Manager",
        role: ComplexRole.Manager,
        avatarUrl: "https://i.pravatar.cc/160?img=32",
        organizationIds: ["org-acme"],
      },
      {
        id: "complex-user-support",
        email: "support@complex.demo",
        password: "demo1234",
        name: "Complex Support",
        role: ComplexRole.Support,
        avatarUrl: null,
        organizationIds: ["org-acme"],
      },
      {
        id: "complex-user-viewer",
        email: "viewer@complex.demo",
        password: "demo1234",
        name: "Complex Viewer",
        role: ComplexRole.Viewer,
        avatarUrl: null,
        organizationIds: ["org-acme"],
      },
    ];
    this.organizations = [
      {
        id: "org-acme",
        name: "Acme Commerce",
        plan: OrganizationPlan.Enterprise,
        timezone: "Europe/Berlin",
        currency: "USD",
        createdAt: "2025-03-01T10:00:00.000Z",
      },
      {
        id: "org-globex",
        name: "Globex Retail",
        plan: OrganizationPlan.Business,
        timezone: "America/New_York",
        currency: "EUR",
        createdAt: "2025-08-15T14:00:00.000Z",
      },
    ];
    this.members = this.users.flatMap((user, userIndex) =>
      user.organizationIds.map((organizationId, organizationIndex) => ({
        id: `member-${userIndex + 1}-${organizationIndex + 1}`,
        organizationId,
        userId: user.id,
        userName: user.name,
        email: user.email,
        role: user.role,
        status: "active" as const,
      })),
    );
    this.categories = [
      {
        id: "complex-category-electronics",
        organizationId: "org-acme",
        name: "Electronics",
        parentId: null,
        childIds: ["complex-category-keyboards"],
      },
      {
        id: "complex-category-keyboards",
        organizationId: "org-acme",
        name: "Keyboards",
        parentId: "complex-category-electronics",
        childIds: [],
      },
      {
        id: "complex-category-office",
        organizationId: "org-acme",
        name: "Office",
        parentId: null,
        childIds: [],
      },
      {
        id: "globex-category-home",
        organizationId: "org-globex",
        name: "Home",
        parentId: null,
        childIds: [],
      },
    ];
    this.brands = [
      {
        id: "brand-northstar",
        organizationId: "org-acme",
        name: "Northstar",
        logoUrl: "https://picsum.photos/seed/northstar/160/80",
      },
      {
        id: "brand-contoso",
        organizationId: "org-acme",
        name: "Contoso",
        logoUrl: null,
      },
      {
        id: "brand-globex",
        organizationId: "org-globex",
        name: "Globex",
        logoUrl: null,
      },
    ];
    const baseProducts = [
      this.product(
        "complex-product-keyboard",
        "org-acme",
        "Pro Mechanical Keyboard",
        "129.90",
        "complex-category-keyboards",
        "brand-northstar",
        ComplexProductStatus.Active,
      ),
      this.product(
        "complex-product-mouse",
        "org-acme",
        "Precision Mouse",
        "79.90",
        "complex-category-electronics",
        "brand-northstar",
        ComplexProductStatus.Active,
      ),
      this.product(
        "complex-product-desk",
        "org-acme",
        "Modular Standing Desk",
        "599.00",
        "complex-category-office",
        "brand-contoso",
        ComplexProductStatus.Draft,
      ),
      this.product(
        "globex-product-lamp",
        "org-globex",
        "Ambient Home Lamp",
        "89.00",
        "globex-category-home",
        "brand-globex",
        ComplexProductStatus.Active,
      ),
    ];
    this.products =
      preset === "large"
        ? Array.from({ length: 250 }, (_, index) => {
            const source = baseProducts[index % 3];
            const number = index + 1;
            return {
              ...source,
              id: `complex-product-${String(number).padStart(3, "0")}`,
              name: `${source.name} ${number}`,
              slug: `${source.slug}-${number}`,
              variants: source.variants.map((variant) => ({
                ...variant,
                id: `${variant.id}-${number}`,
                sku: `${variant.sku}-${number}`,
              })),
            };
          })
        : baseProducts;
    this.warehouses = [
      {
        id: "warehouse-berlin",
        organizationId: "org-acme",
        name: "Berlin Warehouse",
        countryCode: "DE",
        status: "active",
      },
      {
        id: "warehouse-paris",
        organizationId: "org-acme",
        name: "Paris Overflow",
        countryCode: "FR",
        status: "maintenance",
      },
      {
        id: "warehouse-new-york",
        organizationId: "org-globex",
        name: "New York Warehouse",
        countryCode: "US",
        status: "active",
      },
    ];
    this.inventory = [
      {
        id: "inventory-keyboard-berlin",
        productId: "complex-product-keyboard",
        variantId: "variant-complex-product-keyboard-default",
        warehouseId: "warehouse-berlin",
        available: 42,
        reserved: 5,
        reorderPoint: 10,
        version: 2,
      },
      {
        id: "inventory-mouse-berlin",
        productId: "complex-product-mouse",
        variantId: "variant-complex-product-mouse-default",
        warehouseId: "warehouse-berlin",
        available: 8,
        reserved: 2,
        reorderPoint: 12,
        version: 1,
      },
      {
        id: "inventory-lamp-new-york",
        productId: "globex-product-lamp",
        variantId: "variant-globex-product-lamp-default",
        warehouseId: "warehouse-new-york",
        available: 30,
        reserved: 0,
        reorderPoint: 5,
        version: 1,
      },
    ];
    const baseCustomers: CustomerDto[] = [
      {
        id: "customer-ada",
        organizationId: "org-acme",
        name: "Ada Lovelace",
        email: "ada@example.test",
        defaultAddress: {
          line1: "Friedrichstrasse 100",
          line2: null,
          city: "Berlin",
          postalCode: "10117",
          countryCode: "DE",
        },
        tags: ["vip", "newsletter"],
        createdAt: "2026-01-10T09:00:00.000Z",
      },
      {
        id: "customer-grace",
        organizationId: "org-acme",
        name: "Grace Hopper",
        email: "grace@example.test",
        defaultAddress: {
          line1: "1 Compiler Lane",
          line2: "Suite 5",
          city: "Paris",
          postalCode: "75001",
          countryCode: "FR",
        },
        tags: ["b2b"],
        createdAt: "2026-02-12T11:30:00.000Z",
      },
      {
        id: "customer-katherine",
        organizationId: "org-acme",
        name: "Katherine Johnson",
        email: "katherine@example.test",
        defaultAddress: {
          line1: "42 Orbit Road",
          line2: null,
          city: "London",
          postalCode: "SW1A 1AA",
          countryCode: "GB",
        },
        tags: [],
        createdAt: "2026-03-15T08:00:00.000Z",
      },
    ];
    this.customers =
      preset === "large"
        ? Array.from({ length: 250 }, (_, index) => {
            const source = baseCustomers[index % baseCustomers.length];
            return {
              ...source,
              id: `customer-${String(index + 1).padStart(3, "0")}`,
              name: `${source.name} ${index + 1}`,
              email: `customer${index + 1}@example.test`,
            };
          })
        : baseCustomers;
    this.orders = [
      {
        id: "complex-order-001",
        organizationId: "org-acme",
        customerId: "customer-ada",
        status: ComplexOrderStatus.Paid,
        items: [
          {
            productId: "complex-product-keyboard",
            variantId: "variant-complex-product-keyboard-default",
            name: "Pro Mechanical Keyboard",
            quantity: 1,
            unitPrice: { amount: "129.90", currency: "USD" },
          },
        ],
        subtotal: { amount: "129.90", currency: "USD" },
        discount: { amount: "0.00", currency: "USD" },
        total: { amount: "129.90", currency: "USD" },
        shippingAddress: baseCustomers[0].defaultAddress,
        createdAt: "2026-07-20T10:00:00.000Z",
        version: 1,
      },
      {
        id: "complex-order-002",
        organizationId: "org-acme",
        customerId: "customer-grace",
        status: ComplexOrderStatus.Shipped,
        items: [
          {
            productId: "complex-product-mouse",
            variantId: "variant-complex-product-mouse-default",
            name: "Precision Mouse",
            quantity: 2,
            unitPrice: { amount: "79.90", currency: "USD" },
          },
        ],
        subtotal: { amount: "159.80", currency: "USD" },
        discount: { amount: "15.98", currency: "USD" },
        total: { amount: "143.82", currency: "USD" },
        shippingAddress: baseCustomers[1].defaultAddress,
        createdAt: "2026-07-22T12:30:00.000Z",
        version: 2,
      },
    ];
    this.payments = [
      {
        id: "payment-001",
        orderId: "complex-order-001",
        status: "succeeded",
        method: "card",
        amount: { amount: "129.90", currency: "USD" },
        createdAt: "2026-07-20T10:03:00.000Z",
      },
      {
        id: "payment-002",
        orderId: "complex-order-002",
        status: "succeeded",
        method: "bank-transfer",
        amount: { amount: "143.82", currency: "USD" },
        createdAt: "2026-07-22T12:45:00.000Z",
      },
    ];
    this.promotions = [
      {
        id: "promotion-welcome",
        code: "WELCOME10",
        type: "percentage",
        value: "10.00",
        validUntil: "2027-01-01T00:00:00.000Z",
        active: true,
      },
      {
        id: "promotion-old",
        code: "OLD20",
        type: "percentage",
        value: "20.00",
        validUntil: "2025-01-01T00:00:00.000Z",
        active: false,
      },
    ];
    this.reviews = [
      {
        id: "review-001",
        organizationId: "org-acme",
        productId: "complex-product-keyboard",
        customerId: "customer-ada",
        rating: 5,
        comment: "Excellent keyboard for daily development.",
        status: "published",
        createdAt: "2026-07-21T10:00:00.000Z",
      },
    ];
    this.notifications = [
      {
        id: "notification-001",
        organizationId: "org-acme",
        kind: NotificationKind.Order,
        title: "Order shipped",
        payload: {
          type: "order",
          orderId: "complex-order-002",
          status: "shipped",
        },
        read: false,
        createdAt: "2026-07-23T09:00:00.000Z",
      },
      {
        id: "notification-002",
        organizationId: "org-acme",
        kind: NotificationKind.Inventory,
        title: "Low stock",
        payload: {
          type: "inventory",
          productId: "complex-product-mouse",
          remaining: 8,
        },
        read: false,
        createdAt: "2026-07-23T08:00:00.000Z",
      },
      {
        id: "notification-003",
        organizationId: "org-acme",
        kind: NotificationKind.System,
        title: "Maintenance",
        payload: {
          type: "system",
          text: "Scheduled maintenance begins at 02:00 UTC.",
        },
        read: true,
        createdAt: "2026-07-22T16:00:00.000Z",
      },
    ];
    this.files = [
      {
        id: "file-001",
        organizationId: "org-acme",
        name: "products.csv",
        mimeType: "text/csv",
        size: 45,
        downloadUrl: "/api/v1/files/file-001/download",
        createdAt: "2026-07-24T10:00:00.000Z",
      },
    ];
    this.fileContents = new Map([
      ["file-001", Buffer.from("id,name\ncomplex-product-keyboard,Keyboard\n")],
    ]);
    this.auditEvents = [
      {
        id: "audit-001",
        organizationId: "org-acme",
        action: "order.created",
        actorId: "complex-user-admin",
        resourceType: "order",
        resourceId: "complex-order-001",
        metadata: { source: "seed" },
        createdAt: "2026-07-20T10:00:00.000Z",
      },
      {
        id: "audit-002",
        organizationId: "org-acme",
        action: "product.updated",
        actorId: "complex-user-manager",
        resourceType: "product",
        resourceId: "complex-product-keyboard",
        metadata: { version: 3 },
        createdAt: "2026-07-19T10:00:00.000Z",
      },
    ];
    this.jobs = [];
    this.conversations = [
      {
        id: "conversation-support",
        organizationId: "org-acme",
        title: "Order support",
        participantIds: ["complex-user-admin", "complex-user-support"],
        lastMessagePreview: "Can you check order complex-order-001?",
        updatedAt: "2026-07-25T10:05:00.000Z",
      },
    ];
    this.messages = [
      {
        id: "message-001",
        conversationId: "conversation-support",
        senderId: "complex-user-admin",
        text: "Can you check order complex-order-001?",
        clientMessageId: "seed-message-001",
        createdAt: "2026-07-25T10:05:00.000Z",
      },
    ];
    this.orderIdempotency.clear();
    this.sequences = {
      product: this.products.length + 20,
      order: 20,
      review: 20,
      file: 20,
      audit: 20,
      job: 20,
      message: 20,
    };
  }

  findUserByEmail(email: string): ComplexUserRecord | undefined {
    return this.users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  findUserById(id: string): ComplexUserRecord | undefined {
    return this.users.find((user) => user.id === id);
  }

  publicUser(user: ComplexUserRecord): ComplexUserDto {
    const { password: _password, ...publicUser } = user;
    return publicUser;
  }

  listUsers(organizationId: string): ComplexUserDto[] {
    return this.users
      .filter((user) => user.organizationIds.includes(organizationId))
      .map((user) => this.publicUser(user));
  }

  changeUserRole(userId: string, role: ComplexRole): ComplexUserDto {
    const user = this.findUserById(userId);
    if (!user)
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "User not found.",
      });
    user.role = role;
    for (const member of this.members.filter((item) => item.userId === userId))
      member.role = role;
    return this.publicUser(user);
  }

  isMember(userId: string, organizationId: string): boolean {
    return this.members.some(
      (member) =>
        member.userId === userId &&
        member.organizationId === organizationId &&
        member.status === "active",
    );
  }

  listOrganizations(userId: string): OrganizationDto[] {
    const user = this.findUserById(userId);
    return this.organizations.filter((organization) =>
      user?.organizationIds.includes(organization.id),
    );
  }

  getOrganization(id: string, userId: string): OrganizationDto {
    const organization = this.organizations.find(
      (item) => item.id === id && this.isMember(userId, id),
    );
    if (!organization)
      throw new NotFoundException({
        code: "ORGANIZATION_NOT_FOUND",
        message: "Organization not found or unavailable.",
      });
    return organization;
  }

  listMembers(organizationId: string): MemberDto[] {
    return this.members.filter(
      (member) => member.organizationId === organizationId,
    );
  }

  listProducts(organizationId: string, query: CursorProductQueryDto) {
    let products = this.products.filter(
      (product) => product.organizationId === organizationId,
    );
    if (query.search)
      products = products.filter((product) =>
        `${product.name} ${product.description}`
          .toLowerCase()
          .includes(query.search!.toLowerCase()),
      );
    if (query.status)
      products = products.filter((product) => product.status === query.status);
    return this.cursorPage(products, query.cursor, query.limit);
  }

  getProduct(organizationId: string, id: string): ComplexProductDto {
    const product = this.products.find(
      (item) => item.id === id && item.organizationId === organizationId,
    );
    if (!product)
      throw new NotFoundException({
        code: "PRODUCT_NOT_FOUND",
        message: "Product not found.",
      });
    return product;
  }

  createProduct(
    organizationId: string,
    actorId: string,
    dto: CreateComplexProductDto,
  ): ComplexProductDto {
    if (
      !this.categories.some(
        (category) =>
          category.id === dto.categoryId &&
          category.organizationId === organizationId,
      )
    ) {
      throw new UnprocessableEntityException({
        code: "CATEGORY_NOT_FOUND",
        message: "Selected category does not exist in this organization.",
        details: [{ field: "categoryId", message: "Unknown tenant category." }],
      });
    }
    const id = `complex-product-${this.sequences.product++}`;
    const organization = this.organizations.find(
      (item) => item.id === organizationId,
    )!;
    const product: ComplexProductDto = {
      id,
      organizationId,
      name: dto.name,
      slug: `${dto.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${id}`,
      description: dto.description,
      status: dto.status,
      categoryId: dto.categoryId,
      brandId: dto.brandId,
      price: { amount: dto.priceAmount, currency: organization.currency },
      variants: dto.variants.map((variant, index) => ({
        id: `${id}-variant-${index + 1}`,
        sku: variant.sku,
        attributes: variant.attributes,
        price: { amount: variant.priceAmount, currency: organization.currency },
      })),
      tags: dto.tags,
      publishedAt:
        dto.status === ComplexProductStatus.Active
          ? new Date().toISOString()
          : null,
      createdAt: new Date().toISOString(),
      version: 1,
    };
    this.products.unshift(product);
    this.addAudit(organizationId, actorId, "product.created", "product", id, {
      version: 1,
    });
    return product;
  }

  updateProduct(
    organizationId: string,
    actorId: string,
    id: string,
    dto: UpdateComplexProductDto,
  ): ComplexProductDto {
    const product = this.getProduct(organizationId, id);
    if (product.version !== dto.version) {
      throw new ConflictException({
        code: "PRODUCT_VERSION_CONFLICT",
        message: "Product was changed by another user.",
        details: [
          {
            field: "version",
            message: `Current version is ${product.version}.`,
          },
        ],
      });
    }
    const { version: _version, priceAmount, variants, ...changes } = dto;
    Object.assign(product, changes);
    if (priceAmount) product.price.amount = priceAmount;
    if (variants)
      product.variants = variants.map((variant, index) => ({
        id: `${id}-variant-${index + 1}`,
        sku: variant.sku,
        attributes: variant.attributes,
        price: {
          amount: variant.priceAmount,
          currency: product.price.currency,
        },
      }));
    if (dto.status === ComplexProductStatus.Active && !product.publishedAt)
      product.publishedAt = new Date().toISOString();
    product.version += 1;
    this.addAudit(organizationId, actorId, "product.updated", "product", id, {
      version: product.version,
    });
    return product;
  }

  listCategories(organizationId: string): ComplexCategoryDto[] {
    return this.categories.filter(
      (category) => category.organizationId === organizationId,
    );
  }

  listBrands(organizationId: string): BrandDto[] {
    return this.brands.filter(
      (brand) => brand.organizationId === organizationId,
    );
  }

  listWarehouses(organizationId: string): WarehouseDto[] {
    return this.warehouses.filter(
      (warehouse) => warehouse.organizationId === organizationId,
    );
  }

  listInventory(
    organizationId: string,
    productId?: string,
  ): InventoryItemDto[] {
    const warehouseIds = new Set(
      this.listWarehouses(organizationId).map((warehouse) => warehouse.id),
    );
    return this.inventory.filter(
      (item) =>
        warehouseIds.has(item.warehouseId) &&
        (!productId || item.productId === productId),
    );
  }

  adjustInventory(
    organizationId: string,
    actorId: string,
    id: string,
    dto: AdjustInventoryDto,
  ): InventoryItemDto {
    const item = this.listInventory(organizationId).find(
      (inventory) => inventory.id === id,
    );
    if (!item)
      throw new NotFoundException({
        code: "INVENTORY_NOT_FOUND",
        message: "Inventory item not found.",
      });
    if (item.version !== dto.version)
      throw new ConflictException({
        code: "INVENTORY_VERSION_CONFLICT",
        message: "Inventory was changed by another user.",
      });
    if (item.available + dto.delta < 0)
      throw new ConflictException({
        code: "NEGATIVE_INVENTORY",
        message: "Adjustment would make available stock negative.",
      });
    item.available += dto.delta;
    item.version += 1;
    this.addAudit(
      organizationId,
      actorId,
      "inventory.adjusted",
      "inventory",
      id,
      { delta: dto.delta, reason: dto.reason, version: item.version },
    );
    return item;
  }

  listCustomers(organizationId: string, query: CustomerQueryDto) {
    let customers = this.customers.filter(
      (customer) => customer.organizationId === organizationId,
    );
    if (query.search)
      customers = customers.filter((customer) =>
        `${customer.name} ${customer.email}`
          .toLowerCase()
          .includes(query.search!.toLowerCase()),
      );
    const total = customers.length;
    const start = (query.page - 1) * query.limit;
    return {
      data: customers.slice(start, start + query.limit),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  getCustomer(organizationId: string, id: string): CustomerDto {
    const customer = this.customers.find(
      (item) => item.id === id && item.organizationId === organizationId,
    );
    if (!customer)
      throw new NotFoundException({
        code: "CUSTOMER_NOT_FOUND",
        message: "Customer not found.",
      });
    return customer;
  }

  listOrders(organizationId: string, query: OrderCursorQueryDto) {
    let orders = this.orders.filter(
      (order) => order.organizationId === organizationId,
    );
    if (query.status)
      orders = orders.filter((order) => order.status === query.status);
    return this.cursorPage(orders, query.cursor, query.limit);
  }

  getOrder(organizationId: string, id: string): ComplexOrderDto {
    const order = this.orders.find(
      (item) => item.id === id && item.organizationId === organizationId,
    );
    if (!order)
      throw new NotFoundException({
        code: "ORDER_NOT_FOUND",
        message: "Order not found.",
      });
    return order;
  }

  createOrder(
    organizationId: string,
    actorId: string,
    idempotencyKey: string,
    dto: CreateComplexOrderDto,
  ): ComplexOrderDto {
    const previousOrderId = this.orderIdempotency.get(
      `${organizationId}:${idempotencyKey}`,
    );
    if (previousOrderId) return this.getOrder(organizationId, previousOrderId);
    const customer = this.getCustomer(organizationId, dto.customerId);
    if (dto.items.length === 0)
      throw new UnprocessableEntityException({
        code: "EMPTY_ORDER",
        message: "Order must contain at least one item.",
        details: [{ field: "items", message: "Add at least one item." }],
      });
    const organization = this.organizations.find(
      (item) => item.id === organizationId,
    )!;
    const items = dto.items.map((input) => {
      const product = this.getProduct(organizationId, input.productId);
      const variant = product.variants.find(
        (item) => item.id === input.variantId,
      );
      if (!variant)
        throw new UnprocessableEntityException({
          code: "VARIANT_NOT_FOUND",
          message: `Variant ${input.variantId} does not exist.`,
          details: [{ field: "items", message: "Unknown product variant." }],
        });
      return {
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        quantity: input.quantity,
        unitPrice: variant.price,
      };
    });
    const subtotalCents = items.reduce(
      (sum, item) =>
        sum + this.moneyToCents(item.unitPrice.amount) * item.quantity,
      0,
    );
    const promotion = dto.promotionCode
      ? this.promotions.find(
          (item) => item.code === dto.promotionCode && item.active,
        )
      : undefined;
    const discountCents =
      promotion?.type === "percentage"
        ? Math.round((subtotalCents * Number(promotion.value)) / 100)
        : promotion
          ? this.moneyToCents(promotion.value)
          : 0;
    const id = `complex-order-${String(this.sequences.order++).padStart(3, "0")}`;
    const order: ComplexOrderDto = {
      id,
      organizationId,
      customerId: customer.id,
      status: ComplexOrderStatus.AwaitingPayment,
      items,
      subtotal: {
        amount: this.centsToMoney(subtotalCents),
        currency: organization.currency,
      },
      discount: {
        amount: this.centsToMoney(discountCents),
        currency: organization.currency,
      },
      total: {
        amount: this.centsToMoney(Math.max(0, subtotalCents - discountCents)),
        currency: organization.currency,
      },
      shippingAddress: customer.defaultAddress,
      createdAt: new Date().toISOString(),
      version: 1,
    };
    this.orders.unshift(order);
    this.orderIdempotency.set(`${organizationId}:${idempotencyKey}`, id);
    this.addAudit(organizationId, actorId, "order.created", "order", id, {
      idempotencyKey,
    });
    return order;
  }

  cancelOrder(
    organizationId: string,
    actorId: string,
    id: string,
  ): ComplexOrderDto {
    const order = this.getOrder(organizationId, id);
    if (
      [ComplexOrderStatus.Shipped, ComplexOrderStatus.Cancelled].includes(
        order.status,
      )
    ) {
      throw new ConflictException({
        code: "ORDER_CANNOT_BE_CANCELLED",
        message: `Order in ${order.status} status cannot be cancelled.`,
      });
    }
    order.status = ComplexOrderStatus.Cancelled;
    order.version += 1;
    this.addAudit(organizationId, actorId, "order.cancelled", "order", id, {
      version: order.version,
    });
    return order;
  }

  listPayments(organizationId: string): PaymentDto[] {
    const orderIds = new Set(
      this.orders
        .filter((order) => order.organizationId === organizationId)
        .map((order) => order.id),
    );
    return this.payments.filter((payment) => orderIds.has(payment.orderId));
  }

  listPromotions(): PromotionDto[] {
    return this.promotions;
  }

  listReviews(organizationId: string, productId?: string): ReviewDto[] {
    return this.reviews.filter(
      (review) =>
        review.organizationId === organizationId &&
        (!productId || review.productId === productId),
    );
  }

  createReview(organizationId: string, dto: CreateReviewDto): ReviewDto {
    this.getProduct(organizationId, dto.productId);
    this.getCustomer(organizationId, dto.customerId);
    const review: TenantReview = {
      id: `review-${this.sequences.review++}`,
      organizationId,
      ...dto,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    this.reviews.unshift(review);
    return review;
  }

  listNotifications(organizationId: string, cursor?: string, limit = 20) {
    return this.cursorPage(
      this.notifications.filter(
        (notification) => notification.organizationId === organizationId,
      ),
      cursor,
      limit,
    );
  }

  markNotificationRead(organizationId: string, id: string): NotificationDto {
    const notification = this.notifications.find(
      (item) => item.id === id && item.organizationId === organizationId,
    );
    if (!notification)
      throw new NotFoundException({
        code: "NOTIFICATION_NOT_FOUND",
        message: "Notification not found.",
      });
    notification.read = true;
    return notification;
  }

  listFiles(organizationId: string): FileMetadataDto[] {
    return this.files.filter((file) => file.organizationId === organizationId);
  }

  addFile(organizationId: string, file: Express.Multer.File): FileMetadataDto {
    const id = `file-${this.sequences.file++}`;
    const metadata: TenantFile = {
      id,
      organizationId,
      name: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      downloadUrl: `/api/v1/files/${id}/download`,
      createdAt: new Date().toISOString(),
    };
    this.files.unshift(metadata);
    this.fileContents.set(id, file.buffer);
    return metadata;
  }

  getFile(
    organizationId: string,
    id: string,
  ): { metadata: FileMetadataDto; content: Buffer } {
    const metadata = this.files.find(
      (file) => file.id === id && file.organizationId === organizationId,
    );
    const content = this.fileContents.get(id);
    if (!metadata || !content)
      throw new NotFoundException({
        code: "FILE_NOT_FOUND",
        message: "File not found.",
      });
    return { metadata, content };
  }

  listAudit(organizationId: string, query: AuditQueryDto) {
    let events = this.auditEvents.filter(
      (event) => event.organizationId === organizationId,
    );
    if (query.action)
      events = events.filter((event) => event.action === query.action);
    const total = events.length;
    const start = (query.page - 1) * query.limit;
    return {
      data: events.slice(start, start + query.limit),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  startOrdersExport(organizationId: string): JobDto {
    const now = new Date();
    const job: TenantJob = {
      id: `job-${this.sequences.job++}`,
      organizationId,
      type: "orders-export",
      status: JobStatus.Pending,
      progress: 0,
      resultUrl: null,
      error: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      startedAtMs: Date.now(),
    };
    this.jobs.unshift(job);
    return job;
  }

  getJob(organizationId: string, id: string): JobDto {
    const job = this.jobs.find(
      (item) => item.id === id && item.organizationId === organizationId,
    );
    if (!job)
      throw new NotFoundException({
        code: "JOB_NOT_FOUND",
        message: "Background job not found.",
      });
    const elapsed = Date.now() - job.startedAtMs;
    if (elapsed >= 800) {
      job.status = JobStatus.Completed;
      job.progress = 100;
      job.resultUrl = `/api/v1/jobs/${job.id}/result`;
    } else if (elapsed >= 200) {
      job.status = JobStatus.Processing;
      job.progress = Math.min(90, Math.max(20, Math.floor(elapsed / 8)));
    }
    job.updatedAt = new Date().toISOString();
    return job;
  }

  jobResult(organizationId: string, id: string): Buffer {
    const job = this.getJob(organizationId, id);
    if (job.status !== JobStatus.Completed)
      throw new ConflictException({
        code: "JOB_NOT_COMPLETED",
        message: "The export is not ready yet.",
      });
    const rows = this.orders
      .filter((order) => order.organizationId === organizationId)
      .map((order) => `${order.id},${order.status},${order.total.amount}`);
    return Buffer.from(`id,status,total\n${rows.join("\n")}\n`);
  }

  listConversations(organizationId: string, userId: string): ConversationDto[] {
    return this.conversations.filter(
      (conversation) =>
        conversation.organizationId === organizationId &&
        conversation.participantIds.includes(userId),
    );
  }

  getConversation(
    organizationId: string,
    userId: string,
    id: string,
  ): ConversationDto {
    const conversation = this.listConversations(organizationId, userId).find(
      (item) => item.id === id,
    );
    if (!conversation)
      throw new NotFoundException({
        code: "CONVERSATION_NOT_FOUND",
        message: "Conversation not found.",
      });
    return conversation;
  }

  listMessages(
    organizationId: string,
    userId: string,
    conversationId: string,
    cursor?: string,
    limit = 30,
  ) {
    this.getConversation(organizationId, userId, conversationId);
    return this.cursorPage(
      this.messages.filter(
        (message) => message.conversationId === conversationId,
      ),
      cursor,
      limit,
    );
  }

  sendMessage(
    organizationId: string,
    userId: string,
    conversationId: string,
    dto: SendMessageDto,
  ): ChatMessageDto {
    const conversation = this.getConversation(
      organizationId,
      userId,
      conversationId,
    );
    const duplicate = this.messages.find(
      (message) =>
        message.conversationId === conversationId &&
        message.clientMessageId === dto.clientMessageId,
    );
    if (duplicate) return duplicate;
    const message: ChatMessageDto = {
      id: `message-${this.sequences.message++}`,
      conversationId,
      senderId: userId,
      text: dto.text,
      clientMessageId: dto.clientMessageId,
      createdAt: new Date().toISOString(),
    };
    this.messages.push(message);
    conversation.lastMessagePreview = dto.text;
    conversation.updatedAt = message.createdAt;
    return message;
  }

  private product(
    id: string,
    organizationId: string,
    name: string,
    amount: string,
    categoryId: string,
    brandId: string,
    status: ComplexProductStatus,
  ): ComplexProductDto {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const currency = organizationId === "org-acme" ? "USD" : "EUR";
    return {
      id,
      organizationId,
      name,
      slug,
      description: `${name} demonstrates variants, tenant scope and optimistic updates.`,
      status,
      categoryId,
      brandId,
      price: { amount, currency },
      variants: [
        {
          id: `variant-${id}-default`,
          sku: `${id.toUpperCase()}-DEFAULT`,
          attributes: { color: "black", size: "standard" },
          price: { amount, currency },
        },
      ],
      tags: status === ComplexProductStatus.Active ? ["featured"] : ["draft"],
      publishedAt:
        status === ComplexProductStatus.Active
          ? "2026-07-10T09:00:00.000Z"
          : null,
      createdAt: "2026-07-01T09:00:00.000Z",
      version: status === ComplexProductStatus.Active ? 3 : 1,
    };
  }

  private cursorPage<T extends { id: string }>(
    items: T[],
    cursor: string | undefined,
    limit: number,
  ) {
    const cursorIndex = cursor
      ? items.findIndex((item) => item.id === cursor)
      : -1;
    const start = cursorIndex >= 0 ? cursorIndex + 1 : 0;
    const data = items.slice(start, start + limit);
    const hasMore = start + data.length < items.length;
    return {
      data,
      meta: {
        limit,
        nextCursor: hasMore ? (data.at(-1)?.id ?? null) : null,
        hasMore,
      },
    };
  }

  private addAudit(
    organizationId: string,
    actorId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, unknown>,
  ): void {
    this.auditEvents.unshift({
      id: `audit-${this.sequences.audit++}`,
      organizationId,
      action,
      actorId,
      resourceType,
      resourceId,
      metadata,
      createdAt: new Date().toISOString(),
    });
  }

  private moneyToCents(amount: string): number {
    const [whole, fraction = "0"] = amount.split(".");
    return Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
  }

  private centsToMoney(cents: number): string {
    return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
  }
}
