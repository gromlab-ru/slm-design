import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  type CreateOrderDto,
  type CreateProductDto,
  OrderStatus,
  ProductSort,
  type ProductQueryDto,
  type SimpleCategoryDto,
  type SimpleOrderDto,
  type SimpleProductDto,
  SimpleRole,
  type SimpleUserDto,
  type UpdateProductDto,
} from "./simple.dto";

interface SimpleUserRecord extends SimpleUserDto {
  password: string;
}

@Injectable()
export class SimpleStore {
  private users: SimpleUserRecord[] = [];
  private categories: SimpleCategoryDto[] = [];
  private products: SimpleProductDto[] = [];
  private orders: SimpleOrderDto[] = [];
  private productSequence = 10;
  private orderSequence = 10;

  constructor() {
    this.reset("small");
  }

  reset(preset: "small" | "large" = "small"): void {
    this.users = [
      {
        id: "user-admin",
        email: "admin@demo.local",
        password: "demo1234",
        name: "Demo Admin",
        role: SimpleRole.Admin,
        avatarUrl: "https://i.pravatar.cc/160?img=12",
      },
      {
        id: "user-customer",
        email: "customer@demo.local",
        password: "demo1234",
        name: "Demo Customer",
        role: SimpleRole.Customer,
        avatarUrl: null,
      },
    ];
    this.categories = [
      {
        id: "category-electronics",
        name: "Electronics",
        slug: "electronics",
        productCount: 0,
      },
      {
        id: "category-home",
        name: "Home office",
        slug: "home-office",
        productCount: 0,
      },
      { id: "category-books", name: "Books", slug: "books", productCount: 0 },
    ];
    const baseProducts: SimpleProductDto[] = [
      this.product(
        "product-keyboard",
        "Mechanical Keyboard",
        12990,
        "category-electronics",
        24,
        4.8,
      ),
      this.product(
        "product-mouse",
        "Ergonomic Mouse",
        6990,
        "category-electronics",
        42,
        4.6,
      ),
      this.product(
        "product-desk",
        "Standing Desk",
        45900,
        "category-home",
        8,
        4.9,
      ),
      this.product(
        "product-lamp",
        "Focus Desk Lamp",
        5490,
        "category-home",
        31,
        4.5,
      ),
      this.product(
        "product-book",
        "Frontend Systems Handbook",
        3990,
        "category-books",
        100,
        4.7,
      ),
      this.product(
        "product-headphones",
        "Studio Headphones",
        18990,
        "category-electronics",
        12,
        4.4,
      ),
    ];
    this.products =
      preset === "large"
        ? Array.from({ length: 250 }, (_, index) => {
            const source = baseProducts[index % baseProducts.length];
            const number = index + 1;
            return {
              ...source,
              id: `product-${String(number).padStart(3, "0")}`,
              name: `${source.name} ${number}`,
              slug: `${source.slug}-${number}`,
            };
          })
        : baseProducts;
    this.orders = [
      {
        id: "order-001",
        userId: "user-customer",
        status: OrderStatus.Paid,
        items: [
          {
            productId: "product-keyboard",
            productName: "Mechanical Keyboard",
            quantity: 1,
            unitPriceCents: 12990,
          },
        ],
        totalCents: 12990,
        currency: "USD",
        createdAt: "2026-07-20T10:30:00.000Z",
      },
      {
        id: "order-002",
        userId: "user-customer",
        status: OrderStatus.Shipped,
        items: [
          {
            productId: "product-book",
            productName: "Frontend Systems Handbook",
            quantity: 1,
            unitPriceCents: 3990,
          },
        ],
        totalCents: 3990,
        currency: "USD",
        createdAt: "2026-07-22T14:00:00.000Z",
      },
    ];
    this.productSequence = this.products.length + 10;
    this.orderSequence = 10;
    this.updateCategoryCounts();
  }

  findUserByEmail(email: string): SimpleUserRecord | undefined {
    return this.users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  findUserById(id: string): SimpleUserRecord | undefined {
    return this.users.find((user) => user.id === id);
  }

  publicUser(user: SimpleUserRecord): SimpleUserDto {
    const { password: _password, ...publicUser } = user;
    return publicUser;
  }

  changeRole(userId: string, role: SimpleRole): SimpleUserDto {
    const user = this.findUserById(userId);
    if (!user) {
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "User not found.",
      });
    }
    user.role = role;
    return this.publicUser(user);
  }

  listProducts(query: ProductQueryDto): {
    data: SimpleProductDto[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  } {
    let products = [...this.products];
    if (query.search) {
      const search = query.search.toLowerCase();
      products = products.filter((product) =>
        `${product.name} ${product.description}`.toLowerCase().includes(search),
      );
    }
    if (query.categoryId) {
      products = products.filter(
        (product) => product.categoryId === query.categoryId,
      );
    }
    products.sort((left, right) => {
      if (query.sort === ProductSort.PriceAsc)
        return left.priceCents - right.priceCents;
      if (query.sort === ProductSort.PriceDesc)
        return right.priceCents - left.priceCents;
      if (query.sort === ProductSort.Name)
        return left.name.localeCompare(right.name);
      return right.createdAt.localeCompare(left.createdAt);
    });
    const total = products.length;
    const start = (query.page - 1) * query.limit;
    return {
      data: products.slice(start, start + query.limit),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  getProduct(id: string): SimpleProductDto {
    const product = this.products.find((item) => item.id === id);
    if (!product) {
      throw new NotFoundException({
        code: "PRODUCT_NOT_FOUND",
        message: "Product not found.",
      });
    }
    return product;
  }

  createProduct(dto: CreateProductDto): SimpleProductDto {
    if (!this.categories.some((category) => category.id === dto.categoryId)) {
      throw new UnprocessableEntityException({
        code: "CATEGORY_NOT_FOUND",
        message: "Selected category does not exist.",
        details: [{ field: "categoryId", message: "Unknown category." }],
      });
    }
    const id = `product-${this.productSequence++}`;
    const product: SimpleProductDto = {
      id,
      name: dto.name,
      slug: `${dto.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${id}`,
      description: dto.description,
      priceCents: dto.priceCents,
      currency: dto.currency,
      categoryId: dto.categoryId,
      stock: dto.stock,
      rating: 0,
      imageUrl: dto.imageUrl,
      createdAt: new Date().toISOString(),
      version: 1,
    };
    this.products.unshift(product);
    this.updateCategoryCounts();
    return product;
  }

  updateProduct(id: string, dto: UpdateProductDto): SimpleProductDto {
    const product = this.getProduct(id);
    if (product.version !== dto.version) {
      throw new ConflictException({
        code: "PRODUCT_VERSION_CONFLICT",
        message: "Product was changed by another user.",
        details: [
          {
            field: "version",
            message: `Expected ${product.version}, received ${dto.version}.`,
          },
        ],
      });
    }
    const { version: _version, ...changes } = dto;
    Object.assign(product, changes, { version: product.version + 1 });
    this.updateCategoryCounts();
    return product;
  }

  deleteProduct(id: string): void {
    this.getProduct(id);
    this.products = this.products.filter((product) => product.id !== id);
    this.updateCategoryCounts();
  }

  listCategories(): SimpleCategoryDto[] {
    return this.categories;
  }

  getCategory(id: string): SimpleCategoryDto {
    const category = this.categories.find((item) => item.id === id);
    if (!category) {
      throw new NotFoundException({
        code: "CATEGORY_NOT_FOUND",
        message: "Category not found.",
      });
    }
    return category;
  }

  listOrders(userId: string, role: string, page = 1, limit = 20) {
    const orders =
      role === SimpleRole.Admin
        ? this.orders
        : this.orders.filter((order) => order.userId === userId);
    const total = orders.length;
    const start = (page - 1) * limit;
    return {
      data: orders.slice(start, start + limit),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  getOrder(id: string, userId: string, role: string): SimpleOrderDto {
    const order = this.orders.find(
      (item) =>
        item.id === id && (role === SimpleRole.Admin || item.userId === userId),
    );
    if (!order) {
      throw new NotFoundException({
        code: "ORDER_NOT_FOUND",
        message: "Order not found.",
      });
    }
    return order;
  }

  createOrder(userId: string, dto: CreateOrderDto): SimpleOrderDto {
    if (dto.items.length === 0) {
      throw new UnprocessableEntityException({
        code: "EMPTY_ORDER",
        message: "Order must contain at least one item.",
        details: [{ field: "items", message: "Add at least one item." }],
      });
    }
    const items = dto.items.map(({ productId, quantity }) => {
      const product = this.getProduct(productId);
      if (product.stock < quantity) {
        throw new ConflictException({
          code: "INSUFFICIENT_STOCK",
          message: `Not enough stock for ${product.name}.`,
        });
      }
      return {
        productId,
        productName: product.name,
        quantity,
        unitPriceCents: product.priceCents,
      };
    });
    const order: SimpleOrderDto = {
      id: `order-${String(this.orderSequence++).padStart(3, "0")}`,
      userId,
      status: OrderStatus.Pending,
      items,
      totalCents: items.reduce(
        (sum, item) => sum + item.unitPriceCents * item.quantity,
        0,
      ),
      currency: "USD",
      createdAt: new Date().toISOString(),
    };
    this.orders.unshift(order);
    return order;
  }

  cancelOrder(id: string, userId: string, role: string): SimpleOrderDto {
    const order = this.getOrder(id, userId, role);
    if (
      order.status === OrderStatus.Shipped ||
      order.status === OrderStatus.Cancelled
    ) {
      throw new ConflictException({
        code: "ORDER_CANNOT_BE_CANCELLED",
        message: `Order in ${order.status} status cannot be cancelled.`,
      });
    }
    order.status = OrderStatus.Cancelled;
    return order;
  }

  private product(
    id: string,
    name: string,
    priceCents: number,
    categoryId: string,
    stock: number,
    rating: number,
  ): SimpleProductDto {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return {
      id,
      name,
      slug,
      description: `${name} is a deterministic demo product used by frontend examples.`,
      priceCents,
      currency: "USD",
      categoryId,
      stock,
      rating,
      imageUrl: `https://picsum.photos/seed/${slug}/640/480`,
      createdAt: `2026-07-${String(10 + this.products.length).padStart(2, "0")}T09:00:00.000Z`,
      version: 1,
    };
  }

  private updateCategoryCounts(): void {
    for (const category of this.categories) {
      category.productCount = this.products.filter(
        (product) => product.categoryId === category.id,
      ).length;
    }
  }
}
