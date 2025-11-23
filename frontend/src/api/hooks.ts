import { useMutation, useQuery } from "@tanstack/react-query"
import { createContext, useContext } from "react"
import { array, BaseIssue, BaseSchema, boolean, is, isoTimestamp, literal, number, optional, parse, pipe, safeParse, strictObject, string, transform, union, unknown } from "valibot"

export type AuthContext = {
  user: {
    token: string
    user: User
  } | null

  loggedIn(user: { token: string; user: User }): void
  loggedOut(): void
}

export type Response<T> = OkResponse<T> | ErrorResponse

export type OkResponse<T> = {
  ok: true
  data: T
}

export type ErrorResponse = {
  ok: false
  error: string
}

export type OkResponseMessage = {
  ok: true
  message: string
}

export type ResponseMessage = OkResponseMessage | ErrorResponse

const responseMessage = union([
  strictObject({
    ok: literal(true),
    message: string(),
  }),
  strictObject({
    ok: literal(false),
    error: string(),
  }),
])

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

interface BaseApiOptions<TOutput extends { ok: boolean }> {
  endpoint: string
  schema: BaseSchema<unknown, TOutput, BaseIssue<unknown>>
  authContext: AuthContext
}

interface BodyApiOptions<TOutput extends { ok: boolean }> extends BaseApiOptions<TOutput> {
  method: "POST" | "PUT"
  body?: unknown
}

interface BodylessApiOptions<TOutput extends { ok: boolean }> extends BaseApiOptions<TOutput> {
  method: "GET" | "DELETE"
}

type ApiOptions<TOutput extends { ok: boolean }> = BodyApiOptions<TOutput> | BodylessApiOptions<TOutput>

async function api<const TOutput extends { ok: boolean }>(options: ApiOptions<TOutput>): Promise<TOutput & { ok: true }> {
  const req = await fetch(`${endpoint}${options.endpoint}`, {
    ...'body' in options ? { body: JSON.stringify(options.body) } : {},
    method: options.method,
    headers: {
      "Content-Type": "application/json",
      ...options.authContext.user !== null ? { "Authorization": `Bearer ${options.authContext.user.token}` } : {},
    }
  })
  const res = await req.json()
  const parsed = parse(options.schema, res)
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

const parseDate = pipe(string(), isoTimestamp(), transform(str => new Date(str)))

export function useRegister() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: (data: RegisterRequest): Promise<OkResponse<RegisterResponse>> => api({
      endpoint: '/auth/register',
      schema: registerResponse,
      authContext: auth,
      method: "POST",
      body: data,
    }),
    onSuccess(data) {
      auth.loggedIn(data.data)
    },
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

export function useLogin() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: (data: LoginRequest): Promise<OkResponse<LoginResponse>> => api({
      endpoint: '/auth/login',
      schema: loginResponse,
      authContext: auth,
      method: "POST",
      body: data,
    }),
    onSuccess(data) {
      auth.loggedIn(data.data)
    },
  })
}

export type ForgotRequest = {
  email: string
}

export type ForgotResponse = ResponseMessage

export function useForgot() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: (data: ForgotRequest): Promise<OkResponseMessage> => api({
      endpoint: '/auth/forgot',
      schema: responseMessage,
      authContext: auth,
      method: "POST",
      body: data,
    }),
  })
}

export type ResetWithCodeRequest = {
  email: string
  code: string
  newPassword: string
}

export type ResetWithCodeResponse = ResponseMessage

export function useResetWithCode() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: (data: ResetWithCodeRequest): Promise<OkResponseMessage> => api({
      endpoint: '/auth/reset-with-code',
      schema: responseMessage,
      authContext: auth,
      method: "POST",
      body: data,
    }),
  })
}

const knownError = strictObject({
  ok: literal(false),
  error: string(),
})

export function isKnownError(object: unknown): object is { ok: false; error: string } {
  return is(knownError, object)
}

export function useLogout() {
  const auth = useAuthContext()

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

export type Post = {
  _id: string
  title: string
  body: string
  author: string
  authorName: string
  authorEmail: string
  likes: string[]
  comments: Comment[]
  tags: string[]
  edited: boolean
  createdAt: Date
  updatedAt: Date
}

export type Reply = {
  _id: string
  user: string
  userName: string
  userEmail: string
  text: string
  createdAt: Date
}

const reply = strictObject({
  _id: string(),
  user: string(),
  userName: string(),
  userEmail: string(),
  text: string(),
  createdAt: parseDate,
})

export type Comment = {
  _id: string
  user: string
  userName: string
  userEmail: string
  text: string
  createdAt: Date
  replies: Reply[]
}

const comment = strictObject({
  _id: string(),
  user: string(),
  userName: string(),
  userEmail: string(),
  text: string(),
  createdAt: parseDate,
  replies: array(reply),
})

const post = strictObject({
  _id: string(),
  title: string(),
  body: string(),
  author: string(),
  authorName: string(),
  authorEmail: string(),
  likes: array(string()),
  comments: array(comment),
  tags: array(string()),
  edited: boolean(),
  createdAt: parseDate,
  updatedAt: parseDate,
  __v: unknown(),
})

const postResponse = response(post)

export type CreatePostRequest = {
  title: string
  body: string
}

export type CreatePostResponse = Post

export function useCreatePost() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: (data: CreatePostRequest): Promise<OkResponse<CreatePostResponse>> => api({
      endpoint: '/posts',
      schema: postResponse,
      authContext: auth,
      method: "POST",
      body: data,
    }),
    onSuccess(_data, _variables, _result, context) {
      context.client.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export type GetPostResponse = Post

export function useGetPost(id: string, ) {
  const auth = useAuthContext()

  return useQuery({
    queryKey: ['posts', 'one', id] as const,
    queryFn: ({ queryKey }): Promise<OkResponse<GetPostResponse>> => api({
      endpoint: `/posts/${queryKey[1]}`,
      schema: postResponse,
      authContext: auth,
      method: "GET",
    }),
  })
}

export type EditPostRequest = {
  id: string
  title?: string
  body?: string
}

export type EditPostResponse = Post

export function useEditPost() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: ({ id, ...data }: EditPostRequest): Promise<OkResponse<EditPostResponse>> => api({
      endpoint: `/posts/${id}`,
      schema: postResponse,
      authContext: auth,
      method: "PUT",
      body: data,
    }),
    onSuccess(_data, _variables, _result, context) {
      context.client.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export type DeletePostRequest = {
  id: string
}

export type DeletePostResponse = Post

export function useDeletePost() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: ({ id }: DeletePostRequest): Promise<OkResponse<DeletePostResponse>> => api({
      endpoint: `/posts/${id}`,
      schema: postResponse,
      authContext: auth,
      method: "DELETE",
    }),
    onSuccess(_data, _variables, _result, context) {
      context.client.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export type ToggleLikeRequest = {
  id: string
}

export type ToggleLikeResponse = {
  liked: boolean
  likesCount: number
  postId: string
}

const toggleLikeResponse = response(strictObject({
  liked: boolean(),
  likesCount: number(),
  postId: string(),
}))

export function useToggleLike() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: ({ id }: ToggleLikeRequest): Promise<OkResponse<ToggleLikeResponse>> => api({
      endpoint: `/posts/${id}/like`,
      schema: toggleLikeResponse,
      authContext: auth,
      method: "POST",
    }),
    onSuccess(_data, _variables, _result, context) {
      context.client.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export type AddCommentRequest = {
  id: string
  text: string
}

export type AddCommentResponse = {
  postId: string
  commentsCount: number
  comments: Comment[]
}

const addCommentResponse = response(strictObject({
  postId: string(),
  commentsCount: number(),
  comments: array(comment),
}))

export function useAddComment() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: ({ id, ...data }: AddCommentRequest): Promise<OkResponse<AddCommentResponse>> => api({
      endpoint: `/posts/${id}/comment`,
      schema: addCommentResponse,
      authContext: auth,
      method: "POST",
      body: data,
    }),
    onSuccess(_data, _variables, _result, context) {
      context.client.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export type ReplyToCommentRequest = {
  postId: string
  commentId: string
  text: string
}

export type ReplyToCommentResponse = {
  postId: string
  commentId: string
  replies: Reply[]
  reply: Reply
}

const replyToCommentResponse = response(strictObject({
  postId: string(),
  commentId: string(),
  replies: array(reply),
  reply: reply,
}))

export function useReplyToComment() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: ({ postId, commentId, ...data }: ReplyToCommentRequest): Promise<OkResponse<ReplyToCommentResponse>> => api({
      endpoint: `/posts/${postId}/comment/${commentId}/reply`,
      schema: replyToCommentResponse,
      authContext: auth,
      method: "POST",
      body: data,
    }),
    onSuccess(_data, _variables, _result, context) {
      context.client.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export type DeleteCommentRequest = {
  postId: string
  commentId: string
}

export type DeleteCommentResponse = {
  postId: string
  commentsCount: number
  comments: unknown[]
}

const deleteCommentResponse = response(strictObject({
  postId: string(),
  commentsCount: number(),
  comments: array(comment),
}))

export function useDeleteComment() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: ({ postId, commentId }: DeleteCommentRequest): Promise<OkResponse<DeleteCommentResponse>> => api({
      endpoint: `/posts/${postId}/comment/${commentId}`,
      schema: deleteCommentResponse,
      authContext: auth,
      method: "DELETE",
    }),
    onSuccess(_data, _variables, _result, context) {
      context.client.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

export type MyPostsResponse = Post[]

const myPostsResponse = response(array(post))

export function useMyPosts() {
  const auth = useAuthContext()

  return useQuery({
    queryKey: ['posts', 'mine'],
    queryFn: (): Promise<OkResponse<MyPostsResponse>> => api({
      endpoint: `/posts/mine`,
      schema: myPostsResponse,
      authContext: auth,
      method: "GET",
    }),
  })
}

export type FeedPostsResponse = Post[]

const feedPostsResponse = response(array(post))

export function useGetFeedPosts() {
  const auth = useAuthContext()

  return useQuery({
    queryKey: ['posts', 'feed'],
    queryFn: (): Promise<OkResponse<FeedPostsResponse>> => api({
      endpoint: `/posts/feed`,
      schema: feedPostsResponse,
      authContext: auth,
      method: "GET",
    }),
  })
}

export type TrendingPostsResponse = Post[]

const trendingPostsResponse = response(array(post))

export function useGetTrendingPosts() {
  const auth = useAuthContext()

  return useQuery({
    queryKey: ['posts', 'trending'],
    queryFn: (): Promise<OkResponse<TrendingPostsResponse>> => api({
      endpoint: `/posts/trending/all`,
      schema: trendingPostsResponse,
      authContext: auth,
      method: "GET",
    }),
  })
}

export type Notification = {
  _id: string
  user: string
  fromUser: string
  type: "like" | "comment" | "reply"
  post: string
  commentId?: string
  message: string
  read: boolean
  createdAt: Date
  updatedAt: Date
  __v: unknown
}

const notification = strictObject({
  _id: string(),
  user: string(),
  fromUser: string(),
  type: union([literal('like'), literal('comment'), literal('reply')]),
  post: string(),
  commentId: optional(string()),
  message: string(),
  read: boolean(),
  createdAt: parseDate,
  updatedAt: parseDate,
  __v: unknown(),
})

export type MarkNotificationReadRequest = {
  id: string
}

export type MarkNotificationReadResponse = Notification

const markNotificationReadResponse = response(notification)

export function useMarkNotificationRead() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: ({ id }: MarkNotificationReadRequest): Promise<OkResponse<MarkNotificationReadResponse>> => api({
      endpoint: `/notifications/${id}/read`,
      schema: markNotificationReadResponse,
      authContext: auth,
      method: "POST",
    }),
    onSuccess(_data, _variables, _result, context) {
      context.client.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export type MarkAllNotificationsReadResponse = 'ok'

const markAllNotificationsReadResponse = response(literal('ok'))

export function useMarkAllNotificationsRead() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: (): Promise<OkResponse<MarkAllNotificationsReadResponse>> => api({
      endpoint: `/notifications/read-all`,
      schema: markAllNotificationsReadResponse,
      authContext: auth,
      method: "POST",
    }),
    onSuccess(_data, _variables, _result, context) {
      context.client.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export type GetMyNotificationsResponse = Notification[]

const getMyNotificationsResponse = response(array(notification))

export function useGetMyNotifications() {
  const auth = useAuthContext()

  return useQuery({
    queryKey: ['notifications'],
    queryFn: (): Promise<OkResponse<GetMyNotificationsResponse>> => api({
      endpoint: `/notifications`,
      schema: getMyNotificationsResponse,
      authContext: auth,
      method: "GET",
    }),
    refetchInterval: 15000,
  })
}

export const Auth = createContext<AuthContext>(null!)

export function useAuthContext() {
  return useContext(Auth)
}
