class QueryBuilder {
  private model: any;
  private query: Record<string, unknown>;
  private prismaQuery: any = {};

  constructor(model: any, query: Record<string, unknown>) {
    this.model = model;
    this.query = query;
  }
  // Search
  search(searchableFields: string[]) {
    const searchTerm = this.query.searchTerm as string;
    if (searchTerm) {
      this.prismaQuery.where = {
        ...this.prismaQuery.where,
        OR: searchableFields.map((field) => ({
          [field]: { contains: searchTerm, mode: "insensitive" },
        })),
      };
    }
    return this;
  }

  // filter(enumFields: string[] = [], booleanFields: string[] = []) {
  //   const queryObj = { ...this.query };
  //   const excludeFields = [
  //     "searchTerm",
  //     "sort",
  //     "limit",
  //     "page",
  //     "fields",
  //     "populate",
  //     "dateRange",
  //   ];
  //   excludeFields.forEach((field) => delete queryObj[field]);

  //   const formattedFilters: Record<string, any> = {};

  //   for (const [key, value] of Object.entries(queryObj)) {
  //     const nestedKeys = key.split(".");
  //     let currentLevel = formattedFilters;

  //     for (let i = 0; i < nestedKeys.length; i++) {
  //       const field = nestedKeys[i];

  //       if (i === nestedKeys.length - 1) {
  //         if (enumFields.includes(key)) {
  //           currentLevel[field] = {
  //             equals: value,
  //           };
  //         } else if (booleanFields.includes(key)) {
  //           currentLevel[field] = {
  //             equals: value === "true", // Convert "true"/"false" string into boolean
  //           };
  //         } else {
  //           currentLevel[field] = {
  //             contains: value,
  //             mode: "insensitive",
  //           };
  //         }
  //       } else {
  //         currentLevel[field] = currentLevel[field] || {};
  //         currentLevel = currentLevel[field];
  //       }
  //     }
  //   }

  //   this.prismaQuery.where = {
  //     ...this.prismaQuery.where,
  //     ...formattedFilters,
  //   };

  //   return this;
  // }

  filter(enumFields: string[] = [], booleanFields: string[] = []) {
    const queryObj = { ...this.query };
    const excludeFields = [
      "searchTerm",
      "sort",
      "limit",
      "page",
      "fields",
      "populate",
      "dateRange",
    ];
    excludeFields.forEach((field) => delete queryObj[field]);

    const formattedFilters: Record<string, any> = {};

    for (const [key, value] of Object.entries(queryObj)) {
      const nestedKeys = key.split(".");
      let currentLevel = formattedFilters;

      for (let i = 0; i < nestedKeys.length; i++) {
        const field = nestedKeys[i];

        if (i === nestedKeys.length - 1) {
          // 👇 Check for special "null" or "notnull"
          if (value === "null") {
            currentLevel[field] = null; // { equals: null };
          } else if (value === "notnull") {
            currentLevel[field] = { not: null };
          }
          // 👇 Enum field
          else if (enumFields.includes(key)) {
            currentLevel[field] = { equals: value };
          }
          // 👇 Boolean field
          else if (booleanFields.includes(key)) {
            currentLevel[field] = { equals: value === "true" };
          }
          // 👇 Regular string search
          else {
            currentLevel[field] = {
              contains: value,
              mode: "insensitive",
            };
          }
        } else {
          currentLevel[field] = currentLevel[field] || {};
          currentLevel = currentLevel[field];
        }
      }
    }

    this.prismaQuery.where = {
      ...this.prismaQuery.where,
      ...formattedFilters,
    };

    return this;
  }

  rawFilter(filters: Record<string, any>) {
    // Ensure that the filters are merged correctly with the existing where conditions
    this.prismaQuery.where = {
      ...this.prismaQuery.where,
      ...filters,
    };
    return this;
  }

  // Sorting
  sort() {
    const sort = (this.query.sort as string)?.split(",") || ["-createdAt"];
    const orderBy = sort.map((field) => {
      if (field.startsWith("-")) {
        return { [field.slice(1)]: "desc" };
      }
      return { [field]: "asc" };
    });

    this.prismaQuery.orderBy = orderBy;
    return this;
  }

  // Pagination
  paginate() {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;

    this.prismaQuery.skip = skip;
    this.prismaQuery.take = limit;

    return this;
  }

  // Fields Selection
  fields() {
    const fields = (this.query.fields as string)?.split(",") || [];
    if (fields.length > 0) {
      this.prismaQuery.select = fields.reduce(
        (acc: Record<string, boolean>, field) => {
          acc[field] = true;
          return acc;
        },
        {}
      );
    }
    return this;
  }

  // **Include Related Models*/
  include(includableFields: Record<string, boolean | object>) {
    this.prismaQuery.include = {
      ...this.prismaQuery.include,
      ...includableFields,
    };
    return this;
  }

  populate(relations: Record<string, boolean | object>) {
    this.prismaQuery.include = {
      ...this.prismaQuery.include,
      ...Object.fromEntries(
        Object.entries(relations).map(([key, value]) => {
          if (typeof value === "boolean") {
            return [key, value];
          }
          return [key, { include: value }];
        })
      ),
    };
    return this;
  }

  range() {
    // param dateRange = createdAt[2025-02-19T10:13:59.425Z,2025-02-20T10:13:59.425Z];updatedAt[2025-02-19T12:00:00.000Z,2025-02-19T15:00:00.000Z]
    const dateRanges = this.query.dateRange
      ? (this.query.dateRange as string).split(";")
      : [];

    console.log(`see date ranges:`, dateRanges);

    if (dateRanges.length > 0) {
      const rangeFilters: Record<string, any>[] = [];

      dateRanges.forEach((range) => {
        const [fieldName, dateRange] = range.split("[");
        if (fieldName && dateRange) {
          const cleanedDateRange = dateRange.replace("]", "");
          const [startRange, endRange] = cleanedDateRange.split(",");

          const rangeFilter: Record<string, any> = {};
          if (startRange && endRange) {
            rangeFilter[fieldName] = {
              gte: new Date(startRange),
              lte: new Date(endRange),
            };
          } else if (startRange) {
            rangeFilter[fieldName] = { gte: new Date(startRange) };
          } else if (endRange) {
            rangeFilter[fieldName] = { lte: new Date(endRange) };
          }

          if (Object.keys(rangeFilter).length > 0) {
            rangeFilters.push(rangeFilter);
          }
        }
      });

      if (rangeFilters.length > 0) {
        this.prismaQuery.where = {
          ...this.prismaQuery.where,
          OR: rangeFilters,
        };
      }
    }

    return this;
  }

  async execute() {
    console.log("Final Prisma Query:", JSON.stringify(this.prismaQuery)); // 👈 Add this line
    return this.model.findMany(this.prismaQuery);
  }

  // Count Total
  async countTotal() {
    const total = await this.model.count({ where: this.prismaQuery.where });
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const totalPage = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPage,
    };
  }
}

export default QueryBuilder;
