export interface NameValuePayload {
  name: string
  value: number
}

export interface GetMetricsParams {
  groupBy: string
  dateFrom?: string
  dateTo?: string
}

export interface GetMetricsResponse {
  start_date: Date
  name: string
  average: number
}

export interface GetDimensionsResponse {
  name: string
}

export interface ClickhouseClientParams {
  host: string
  port: number
  protocol: "http:" | "https:"
  pathname?: string
  timeout?: number
  queryOptions?: {
    database?: string
  }
  migrations?: {
    directory: string
  }
}

export interface ClickhouseQueryResponse<T> {
  meta: Array<{ name: string; type: string }>
  data: Array<T>
  rows: number
  statistics: {
    elapsed: number
    rows_read: number
    bytes_read: number
  }
  transferred: number
}
