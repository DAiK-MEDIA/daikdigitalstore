const mockDb = {
  data_plans: [
    { id: 1, size_label: '1GB', size_gb: 1, client_price: 4.2,  agent_price: 3.8,  is_active: true },
    { id: 2, size_label: '2GB', size_gb: 2, client_price: 8.0,  agent_price: 7.2,  is_active: true },
    { id: 3, size_label: '3GB', size_gb: 3, client_price: 12.0, agent_price: 10.8, is_active: true },
    { id: 4, size_label: '4GB', size_gb: 4, client_price: 15.5, agent_price: 14.0, is_active: true },
    { id: 5, size_label: '5GB', size_gb: 5, client_price: 19.5, agent_price: 17.5, is_active: true },
    { id: 6, size_label: '6GB', size_gb: 6, client_price: 23.0, agent_price: 20.5, is_active: true },
    { id: 7, size_label: '8GB', size_gb: 8, client_price: 30.0, agent_price: 27.0, is_active: true },
    { id: 8, size_label: '10GB', size_gb: 10, client_price: 37.5, agent_price: 34.0, is_active: true },
    { id: 9, size_label: '15GB', size_gb: 15, client_price: 55.0, agent_price: 50.0, is_active: true },
    { id: 10, size_label: '20GB', size_gb: 20, client_price: 70.0, agent_price: 63.0, is_active: true },
    { id: 11, size_label: '25GB', size_gb: 25, client_price: 85.0, agent_price: 76.5, is_active: true },
    { id: 12, size_label: '30GB', size_gb: 30, client_price: 100.0, agent_price: 90.0, is_active: true },
    { id: 13, size_label: '40GB', size_gb: 40, client_price: 130.0, agent_price: 117.0, is_active: true },
    { id: 14, size_label: '50GB', size_gb: 50, client_price: 160.0, agent_price: 144.0, is_active: true },
  ],
  orders: [],
  admin_settings: [
    { id: 1, key: 'whatsapp_link', value: 'https://api.whatsapp.com/send/?phone=233531257913' },
    { id: 2, key: 'auto_fulfill_api', value: 'true' },
    { id: 3, key: 'auto_fulfill_api_myztadata', value: 'false' },
  ],
};

const makeId = (tableName: keyof typeof mockDb) => {
  const table = mockDb[tableName];
  const ids = table.map((item: any) => Number(item.id)).filter(Boolean);
  return ids.length > 0 ? Math.max(...ids) + 1 : 1;
};

const applyFilters = (rows: any[], filters: any[]) => {
  let data = [...rows];

  for (const filter of filters) {
    if (filter.op === 'eq') {
      data = data.filter(row => String(row[filter.field]) === String(filter.value));
    } else if (filter.op === 'in') {
      const values = filter.value.map((v: any) => String(v));
      data = data.filter(row => values.includes(String(row[filter.field])));
    }
  }

  return data;
};

const attachRelations = (tableName: keyof typeof mockDb, rows: any[]) => {
  if (tableName === 'orders') {
    return rows.map(row => {
      const plan = mockDb.data_plans.find(planRow => planRow.id === row.plan_id);
      return {
        ...row,
        data_plans: plan ? { size_label: plan.size_label } : null,
      };
    });
  }

  return rows;
};

class MockQuery {
  private tableName: keyof typeof mockDb;
  private selectedColumns: string | null = null;
  private filters: any[] = [];
  private insertPayload: any = null;
  private updatePayload: any = null;
  private orderBy: { field: string; ascending: boolean } | null = null;

  constructor(tableName: keyof typeof mockDb) {
    this.tableName = tableName;
  }

  select(columns = '*') {
    this.selectedColumns = columns;
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, op: 'eq', value });
    return this;
  }

  in(field: string, values: any[]) {
    this.filters.push({ field, op: 'in', value: values });
    return this;
  }

  order(field: string, opts: { ascending: boolean }) {
    this.orderBy = { field, ascending: opts.ascending };
    return this;
  }

  insert(payload: any) {
    this.insertPayload = payload;
    return this;
  }

  update(payload: any) {
    this.updatePayload = payload;
    return this;
  }

  async single() {
    const result = await this.execute();
    return {
      data: Array.isArray(result.data) ? result.data[0] ?? null : result.data,
      error: result.error,
    };
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute() {
    const table: any[] = mockDb[this.tableName] as any[];
    let rows: any[] = [...table];

    if (this.insertPayload) {
      const values = Array.isArray(this.insertPayload) ? this.insertPayload : [this.insertPayload];
      const inserted = values.map(value => {
        const newRow = {
          id: makeId(this.tableName),
          created_at: new Date().toISOString(),
          ...value,
        };
        table.push(newRow);
        return newRow;
      });

      return { data: inserted, error: null };
    }

    rows = applyFilters(rows, this.filters);

    if (this.updatePayload) {
      const updated = rows.map(row => {
        const updatedRow = { ...row, ...this.updatePayload };
        const idx = table.findIndex(item => item.id === row.id);
        if (idx >= 0) table[idx] = updatedRow;
        return updatedRow;
      });

      const attached = attachRelations(this.tableName, updated);
      return { data: attached, error: null };
    }

    if (this.orderBy) {
      rows.sort((a: any, b: any) => {
        const left = a[this.orderBy!.field] as any;
        const right = b[this.orderBy!.field] as any;
        if (left === right) return 0;
        return this.orderBy!.ascending ? (left < right ? -1 : 1) : (left > right ? -1 : 1);
      });
    }

    rows = attachRelations(this.tableName, rows);

    return { data: rows, error: null };
  }
}

export const mockSupabase = {
  from(tableName: keyof typeof mockDb) {
    return new MockQuery(tableName);
  },
};

export const isMockSupabase = true;
