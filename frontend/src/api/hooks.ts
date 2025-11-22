import { useMutation, useQuery } from "@tanstack/react-query"
import { array, BaseIssue, BaseSchema, boolean, is, literal, never, number, parse, safeParse, strictObject, string, union } from "valibot"

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

export function useRegister(auth: AuthContext) {
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

export function useLogin(auth: AuthContext) {
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

export function useForgot(auth: AuthContext) {
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

export function useResetWithCode(auth: AuthContext) {
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

export type Post = {
  title: string
  body: string
  author: unknown
  authorName: string
  authorEmail: string
  likes: unknown[]
  comments: {
    userId: unknown
    text: string
    createdAt: unknown
  }[]
  tags: string[]
}

const post = strictObject({
  title: string(),
  body: string(),
  author: never(),
  authorName: string(),
  authorEmail: string(),
  likes: array(never()),
  comments: array(strictObject({
    userId: never(),
    text: string(),
    createdAt: never(),
  })),
  tags: array(string()),
})

const postResponse = response(post)

export type CreatePostRequest = {
  title: string
  body: string
}

export type CreatePostResponse = Post

export function useCreatePost(auth: AuthContext) {
  return useMutation({
    mutationFn: (data: CreatePostRequest): Promise<OkResponse<CreatePostResponse>> => api({
      endpoint: '/posts',
      schema: postResponse,
      authContext: auth,
      method: "POST",
      body: data,
    }),
  })
}

export type GetPostResponse = Post

export function useGetPost(id: string, auth: AuthContext) {
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

export function useEditPost(auth: AuthContext) {
  return useMutation({
    mutationFn: ({ id, ...data }: EditPostRequest): Promise<OkResponse<EditPostResponse>> => api({
      endpoint: `/posts/${id}`,
      schema: postResponse,
      authContext: auth,
      method: "PUT",
      body: data,
    }),
  })
}

export type DeletePostRequest = {
  id: string
}

export type DeletePostResponse = Post

export function useDeletePost(auth: AuthContext) {
  return useMutation({
    mutationFn: ({ id }: DeletePostRequest): Promise<OkResponse<DeletePostResponse>> => api({
      endpoint: `/posts/${id}`,
      schema: postResponse,
      authContext: auth,
      method: "DELETE",
    }),
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

export function useToggleLike(auth: AuthContext) {
  return useMutation({
    mutationFn: ({ id }: ToggleLikeRequest): Promise<OkResponse<ToggleLikeResponse>> => api({
      endpoint: `/posts/${id}/like`,
      schema: toggleLikeResponse,
      authContext: auth,
      method: "POST",
    }),
  })
}

export type AddCommentRequest = {
  id: string
  text: string
}

export type AddCommentResponse = {
  postId: string
  commentsCount: number
  comments: unknown[]
}

const addCommentResponse = response(strictObject({
  postId: string(),
  commentsCount: number(),
  comments: array(never()),
}))

export function useAddComment(auth: AuthContext) {
  return useMutation({
    mutationFn: ({ id, ...data }: AddCommentRequest): Promise<OkResponse<AddCommentResponse>> => api({
      endpoint: `/posts/${id}/comment`,
      schema: addCommentResponse,
      authContext: auth,
      method: "POST",
      body: data,
    }),
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
  replies: unknown[]
  reply: unknown
}

const replyToCommentResponse = response(strictObject({
  postId: string(),
  commentId: string(),
  replies: array(never()),
  reply: never(),
}))

export function useReplyToComment(auth: AuthContext) {
  return useMutation({
    mutationFn: ({ postId, commentId, ...data }: ReplyToCommentRequest): Promise<OkResponse<ReplyToCommentResponse>> => api({
      endpoint: `/posts/${postId}/comment/${commentId}/reply`,
      schema: replyToCommentResponse,
      authContext: auth,
      method: "POST",
      body: data,
    }),
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
  comments: array(never()),
}))

export function useDeleteComment(auth: AuthContext) {
  return useMutation({
    mutationFn: ({ postId, commentId }: DeleteCommentRequest): Promise<OkResponse<DeleteCommentResponse>> => api({
      endpoint: `/posts/${postId}/comment/${commentId}`,
      schema: deleteCommentResponse,
      authContext: auth,
      method: "POST",
    })
  })
}

export type MyPostsResponse = {
  posts: Post[]
}

const myPostsResponse = response(strictObject({
  posts: array(post),
}))

export function useMyPosts(auth: AuthContext) {
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

export type FeedPostsResponse = {
  posts: Post[]
}

const feedPostsResponse = response(strictObject({
  posts: array(post),
}))

export function useGetFeedPosts(auth: AuthContext) {
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

export type TrendingPostsResponse = {
  posts: Post[]
}

const trendingPostsResponse = response(strictObject({
  posts: array(post),
}))

export function useGetTrendingPosts(auth: AuthContext) {
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

}

const notification = strictObject({
})

export type MarkNotificationReadRequest = {
  id: string
}

export type MarkNotificationReadResponse = Notification

const markNotificationReadResponse = response(notification)

export function useMarkNotificationRead(auth: AuthContext) {
  return useMutation({
    mutationFn: ({ id }: MarkNotificationReadRequest): Promise<OkResponse<MarkNotificationReadResponse>> => api({
      endpoint: `/notifications/${id}/read`,
      schema: markNotificationReadResponse,
      authContext: auth,
      method: "POST",
    }),
  })
}

export type MarkAllNotificationsReadResponse = 'ok'

const markAllNotificationsReadResponse = response(literal('ok'))

export function useMarkAllNotificationsRead(auth: AuthContext) {
  return useMutation({
    mutationFn: (): Promise<OkResponse<MarkAllNotificationsReadResponse>> => api({
      endpoint: `/notifications/read-all`,
      schema: markAllNotificationsReadResponse,
      authContext: auth,
      method: "POST",
    }),
  })
}

export type GetMyNotificationsResponse = Notification[]

const getMyNotificationsResponse = response(array(notification))

export function useGetMyNotifications(auth: AuthContext) {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: (): Promise<OkResponse<GetMyNotificationsResponse>> => api({
      endpoint: `/notifications`,
      schema: getMyNotificationsResponse,
      authContext: auth,
      method: "GET",
    }),
  })
}
