export interface FakeAuthUser {
  id: string;
  email?: string;
  app_metadata: { role?: string };
}

export interface FakeProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  role: "customer" | "admin";
  created_at: string;
}

interface FakeSupabaseOptions {
  usersByToken: Record<string, FakeAuthUser>;
  profiles: FakeProfileRow[];
}

export function createFakeSupabaseClient(options: FakeSupabaseOptions) {
  const { usersByToken, profiles } = options;

  function from(table: string) {
    if (table !== "profiles") {
      throw new Error(`FakeSupabaseClient: unsupported table "${table}"`);
    }

    return {
      select() {
        return {
          eq(column: keyof FakeProfileRow, value: string) {
            return {
              async maybeSingle() {
                const row = profiles.find((p) => p[column] === value);
                return { data: row ?? null, error: null };
              },
            };
          },
          order(column: keyof FakeProfileRow, opts: { ascending: boolean }) {
            const sorted = [...profiles].sort((a, b) => {
              const av = a[column];
              const bv = b[column];
              const cmp = av! < bv! ? -1 : av! > bv! ? 1 : 0;
              return opts.ascending ? cmp : -cmp;
            });
            return Promise.resolve({ data: sorted, error: null });
          },
        };
      },
      update(patch: Partial<FakeProfileRow>) {
        return {
          eq(column: keyof FakeProfileRow, value: string) {
            return {
              select() {
                return {
                  async single() {
                    const row = profiles.find((p) => p[column] === value);
                    if (!row) {
                      return { data: null, error: { message: "Row not found" } };
                    }
                    Object.assign(row, patch);
                    return { data: row, error: null };
                  },
                };
              },
            };
          },
        };
      },
    };
  }

  return {
    from,
    auth: {
      async getUser(token: string) {
        const user = usersByToken[token];
        if (!user) {
          return { data: { user: null }, error: { message: "Invalid token" } };
        }
        return { data: { user }, error: null };
      },
      admin: {
        async getUserById(id: string) {
          const user = Object.values(usersByToken).find((u) => u.id === id);
          if (!user) {
            return { data: { user: null }, error: { message: "User not found" } };
          }
          return { data: { user }, error: null };
        },
        async updateUserById(
          id: string,
          patch: { app_metadata?: Record<string, unknown> }
        ) {
          const user = Object.values(usersByToken).find((u) => u.id === id);
          if (!user) {
            return { data: { user: null }, error: { message: "User not found" } };
          }
          if (patch.app_metadata) {
            user.app_metadata = { ...user.app_metadata, ...patch.app_metadata };
          }
          return { data: { user }, error: null };
        },
        async listUsers() {
          return { data: { users: Object.values(usersByToken) }, error: null };
        },
      },
    },
  };
}
