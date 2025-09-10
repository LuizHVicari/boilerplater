import { UserModel } from "src/modules/users/domain/models/user.model";
import { ListUserProps, UserQueryRepository } from "../ports/user-query-repo.service";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { usersTable } from "src/db/schema";
import { and, count, eq, gte, like, lte, or, SQL } from "drizzle-orm";
import { UserModelSchemaMapper } from "./user-model-schema-mapper";
import { AnyPgColumn } from "drizzle-orm/pg-core";

export class UserQueryDrizzleRepository implements UserQueryRepository {
  private readonly mapper = new UserModelSchemaMapper();

  constructor(private readonly db: PostgresJsDatabase) {}

  async findUserById(userId: string): Promise<UserModel | undefined> {
    const [result] = await this.db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!result) {
      return undefined;
    }
    return this.mapper.dB2Model(result);
  }

  async findUserByEmail(email: string): Promise<UserModel | undefined> {
    const [result] = await this.db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!result) {
      return undefined;
    }
    return this.mapper.dB2Model(result);
  }

  async findUsers(props: Partial<ListUserProps>): Promise<{ data: UserModel[]; count: number }> {
    const conditions = this.buildWhereConditions(props);
    const limit = props.limit ?? Number.MAX_SAFE_INTEGER;
    const offset = props.offset ?? 0;

    const baseCountQuery = this.db.select({ count: count() }).from(usersTable);
    const baseDataQuery = this.db.select().from(usersTable);

    const countQuery = conditions ? baseCountQuery.where(conditions) : baseCountQuery;

    const resultsQuery = conditions
      ? baseDataQuery.where(conditions).limit(limit).offset(offset).orderBy(usersTable.createdAt)
      : baseDataQuery.limit(limit).offset(offset).orderBy(usersTable.createdAt);

    const [[countResult], results] = await Promise.all([countQuery, resultsQuery]);

    return {
      data: results.map(user => this.mapper.dB2Model(user)),
      count: countResult.count,
    };
  }

  private buildSearchConditions(props: Partial<ListUserProps>): Array<SQL<unknown>> {
    if (!props.search) {
      return [];
    }

    const searchCondition = or(
      like(usersTable.firstName, `%${props.search}%`),
      like(usersTable.lastName, `%${props.search}%`),
      like(usersTable.email, `%${props.search}%`),
    );

    return searchCondition ? [searchCondition] : [];
  }

  private buildWhereConditions(props: Partial<ListUserProps>): SQL<unknown> | undefined {
    const conditions: Array<SQL<unknown>> = [
      ...this.buildSearchConditions(props),
      ...this.buildFieldConditions(props),
      ...this.buildDateConditions(props),
    ];

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private buildFieldConditions(props: Partial<ListUserProps>): Array<SQL<unknown>> {
    const conditions: Array<SQL<unknown>> = [];

    this.addStringCondition(conditions, props.firstName, usersTable.firstName);
    this.addStringCondition(conditions, props.lastName, usersTable.lastName);
    this.addStringCondition(conditions, props.email, usersTable.email);

    this.addEqualCondition(conditions, props.active, usersTable.active);
    this.addEqualCondition(conditions, props.emailConfirmed, usersTable.emailConfirmed);
    this.addEqualCondition(conditions, props.invitedById, usersTable.invitedById);

    return conditions;
  }

  private addStringCondition(
    conditions: Array<SQL<unknown>>,
    value: string | undefined,
    column: AnyPgColumn,
  ): void {
    if (value) {
      conditions.push(like(column, `%${value}%`));
    }
  }

  private addEqualCondition<T>(
    conditions: Array<SQL<unknown>>,
    value: T | undefined,
    column: AnyPgColumn,
  ): void {
    if (value !== undefined) {
      conditions.push(eq(column, value));
    }
  }

  private buildDateConditions(props: Partial<ListUserProps>): Array<SQL<unknown>> {
    const conditions: Array<SQL<unknown>> = [];

    const dateMappings = [
      { prop: props.createdAtGte, column: usersTable.createdAt, operator: gte },
      { prop: props.createdAtLte, column: usersTable.createdAt, operator: lte },
      { prop: props.updatedAtGte, column: usersTable.updatedAt, operator: gte },
      { prop: props.updatedAtLte, column: usersTable.updatedAt, operator: lte },
    ];

    dateMappings.forEach(({ prop, column, operator }) => {
      if (prop) {
        conditions.push(operator(column, prop));
      }
    });

    return conditions;
  }
}
