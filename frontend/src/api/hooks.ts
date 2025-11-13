import { useMutation } from "@tanstack/react-query"
import { BaseIssue, BaseSchema, is, literal, parse, safeParse, strictObject, string, union } from "valibot"

export type AuthContext = {
  user: {
    token: string
    user: User
  } | null

  loggedIn(user: { token: string; user: User }): void
  loggedOut(): void
}

export type Response<T> = {
  ok: true
  data: T
} | {
  ok: false
  error: string
}

function response<const TData extends BaseSchema<unknown, unknown, BaseIssue<unknown>>>(data: TData) {
  return union([
    strictObject({
      ok: literal(true),
      data,
    }),
    strictObject({
      ok: literal(false),
      error: string(),
    }),
  ])
}

const endpoint = 'http://localhost:5050/api'

async function api<const TOutput extends { ok: boolean }>(uri: string, body: unknown, schema: BaseSchema<unknown, TOutput, BaseIssue<unknown>>): Promise<TOutput & { ok: true }> {
  const req = await fetch(`${endpoint}${uri}`, {
    body: JSON.stringify(body),
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    }
  })
  const res = await req.json()
  const parsed = parse(schema, res)
  if (parsed.ok === false) {
    throw parsed
  }

  return parsed as TOutput & { ok: true }
}

export type User = {
  id: string
  name: string
  email: string
}

const user = strictObject({
  id: string(),
  name: string(),
  email: string(),
})

export type RegisterRequest = {
  name: string
  email: string
  password: string
}

export type RegisterResponse = {
  token: string
  user: User
}

const registerResponse = response(strictObject({
  token: string(),
  user,
}))

export function useRegister(auth: AuthContext) {
  return useMutation({
    async mutationFn(data: RegisterRequest): Promise<Response<RegisterResponse>> {
      const result = await api('/auth/register', data, registerResponse)
      auth.loggedIn(result.data)
      return result
    }
  })
}

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  token: string
  user: User
}

const loginResponse = response(strictObject({
  token: string(),
  user,
}))

export function useLogin(auth: AuthContext) {
  return useMutation({
    async mutationFn(data: LoginRequest): Promise<Response<LoginResponse>> {
      const result = await api('/auth/login', data, loginResponse)
      auth.loggedIn(result.data)
      return result
    }
  })
}

export type ForgotRequest = {
  email: string
}

export type ForgotResponse = {
  ok: false
  error: string
} | {
  ok: true
  message: string
}

const forgotResponse = union([
  strictObject({
    ok: literal(true),
    message: string(),
  }),
  strictObject({
    ok: literal(false),
    error: string(),
  }),
])

export function useForgot() {
  return useMutation({
    async mutationFn(data: ForgotRequest): Promise<ForgotResponse> {
      return api('/auth/forgot', data, forgotResponse)
    }
  })
}

export type ResetWithCodeRequest = {
  email: string
  code: string
  newPassword: string
}

export type ResetWithCodeResponse = {
  ok: false
  error: string
} | {
  ok: true
  message: string
}

const ResetWithCodeResponse = union([
  strictObject({
    ok: literal(true),
    message: string(),
  }),
  strictObject({
    ok: literal(false),
    error: string(),
  }),
])

export function useResetWithCode() {
  return useMutation({
    async mutationFn(data: ResetWithCodeRequest): Promise<ResetWithCodeResponse> {
      return api('/auth/reset-with-code', data, forgotResponse)
    }
  })
}

const knownError = strictObject({
  ok: literal(false),
  error: string(),
})

export function isKnownError(object: unknown): object is { ok: false; error: string } {
  return is(knownError, object)
}

export function useLogout(auth: AuthContext) {
  return useMutation({
    async mutationFn() {
      auth.loggedOut()
    },
  })
}

const stored = strictObject({
  token: string(),
  user,
})

export function initialUser() {
  const val = localStorage.getItem('auth')
  if (val === null) {
    return null
  }
  const parsed = JSON.parse(val)
  const result = safeParse(stored, parsed)
  if (result.success) {
    return result.output
  }
  return null
}
