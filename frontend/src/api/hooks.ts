import { useMutation, useQuery } from "@tanstack/react-query"
import { createContext, useContext } from "react"
import { array, BaseIssue, BaseSchema, boolean, is, isoTimestamp, literal, nullable, number, optional, parse, pipe, safeParse, strictObject, string, transform, union, unknown } from "valibot"

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

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:5050'

const endpoint = `${API_BASE}/api`

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

export type Report = {
  _id: string
  type: "post" | "comment" | "user"
  post: string | null
  commentId: string | null
  reportedUser: string | null
  reportedBy: string | null
  reason: string | null
  status: "pending" | "reviewed" | "dismissed" | null
  createdAt: Date
  updatedAt: Date
  __v: unknown
}

const report = strictObject({
  _id: string(),
  type: union([literal('post'), literal('comment'), literal('user')]),
  post: nullable(string()),
  commentId: nullable(string()),
  reportedUser: nullable(string()),
  reportedBy: nullable(string()),
  reason: nullable(string()),
  status: nullable(union([literal('pending'), literal('reviewed'), literal('dismissed')])),
  createdAt: parseDate,
  updatedAt: parseDate,
  __v: unknown(),
})

export type ReportPostRequest = {
  id: string
  reason?: string
}

export type ReportPostResponse = Report

const reportPostResponse = response(report)

export function useReportPost() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: ({ id, ...data }: ReportPostRequest): Promise<OkResponse<ReportPostResponse>> => api({
      endpoint: `/reports/post/${id}`,
      schema: reportPostResponse,
      authContext: auth,
      method: "POST",
      body: data,
    }),
  })
}

export type ReportCommentRequest = {
  postId: string
  commentId: string
  reason?: string
}

export type ReportCommentResponse = Report

const reportCommentResponse = response(report)

export function useReportComment() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: ({ postId, commentId, ...data }: ReportCommentRequest): Promise<OkResponse<ReportCommentResponse>> => api({
      endpoint: `/reports/post/${postId}/comment/${commentId}`,
      schema: reportCommentResponse,
      authContext: auth,
      method: "POST",
      body: data,
    }),
  })
}

export type ToggleBlockRequest = {
  id: string
}

export type ToggleBlockResponse = {
  blocked: boolean
  blockedUserId: string
}

const toggleBlock = strictObject({
  blocked: boolean(),
  blockedUserId: string(),
})

const toggleBlockResponse = response(toggleBlock)

export function useToggleBlock() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: ({ id }: ToggleBlockRequest): Promise<OkResponse<ToggleBlockResponse>> => api({
      endpoint: `/users/${id}/block`,
      schema: toggleBlockResponse,
      authContext: auth,
      method: "POST",
    }),
    onSuccess(_data, _variables, _result, context) {
      context.client.invalidateQueries({ queryKey: ['posts'] })
      context.client.invalidateQueries({ queryKey: ['blocked'] })
    },
  })
}

export type GetBlockedResponse = {
  id: string
  name: string
  email: string
  major: string
  department: string
  year: string
}[]

const getBlockedResponse = response(array(strictObject({
  id: string(),
  name: string(),
  email: string(),
  major: string(),
  department: string(),
  year: string(),
})))

export function useGetBlockedUsers() {
  const auth = useAuthContext()

  return useQuery({
    queryKey: ['blocked'] as const,
    queryFn: (): Promise<OkResponse<GetBlockedResponse>> => api({
      endpoint: `/users/blocked`,
      schema: getBlockedResponse,
      authContext: auth,
      method: "GET",
    }),
  })
}

export type GroupMember = {
  _id: string
  name: string
  email: string
}

const groupMember = strictObject({
  _id: string(),
  name: string(),
  email: string(),
})

// createdBy / members can be either a string id or a populated GroupMember
const groupMemberRef = union([
  string(),
  groupMember,
])

export type Group = {
  _id: string
  name: string
  description: string
  isPublic: boolean
  createdBy: string
  members: string[]
  createdAt: Date
  updatedAt: Date
  __v: unknown
}

const group = strictObject({
  _id: string(),
  name: string(),
  description: string(),
  isPublic: boolean(),
  createdBy: string(),
  members: array(string()),
  createdAt: parseDate,
  updatedAt: parseDate,
  __v: unknown(),
})

export type GroupDetails = {
  _id: string
  name: string
  description: string
  isPublic: boolean
  createdBy: GroupMember
  members: GroupMember[]
  createdAt: Date
  updatedAt: Date
  __v: unknown
}

const groupDetails = strictObject({
  _id: string(),
  name: string(),
  description: string(),
  isPublic: boolean(),
  createdBy: groupMember,
  members: array(groupMember),
  createdAt: parseDate,
  updatedAt: parseDate,
  __v: unknown(),
})

export type ListGroupsResponse = Group[]

const listGroupsResponse = response(array(group))

export function useListGroups() {
  const auth = useAuthContext()

  return useQuery({
    queryKey: ['groups'],
    queryFn: (): Promise<OkResponse<ListGroupsResponse>> => api({
      endpoint: `/groups`,
      schema: listGroupsResponse,
      authContext: auth,
      method: "GET",
    }),
  })
}

export type CreateGroupRequest = {
  name: string
  description: string
  isPublic: boolean
}

export type CreateGroupResponse = Group

const createGroupResponse = response(group)

export function useCreateGroup() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: (data: CreateGroupRequest): Promise<OkResponse<CreateGroupResponse>> => api({
      endpoint: `/groups`,
      schema: createGroupResponse,
      authContext: auth,
      method: "POST",
      body: data,
    }),
    onSuccess(_data, _variables, _result, context) {
      context.client.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}

export type MyGroupsResponse = Group[]

const myGroupsResponse = response(array(group))

export function useListMyGroups() {
  const auth = useAuthContext()

  return useQuery({
    queryKey: ['groups', 'mine'],
    queryFn: (): Promise<OkResponse<MyGroupsResponse>> => api({
      endpoint: `/groups/mine`,
      schema: myGroupsResponse,
      authContext: auth,
      method: "GET",
    }),
  })
}

export type GetGroupRequest = {
  id: string
}

export type GetGroupResponse = GroupDetails

const getGroupResponse = response(groupDetails)

export function useGetGroup(id: string) {
  const auth = useAuthContext()

  return useQuery({
    queryKey: ['groups', 'one', id] as const,
    queryFn: ({ queryKey }): Promise<OkResponse<GetGroupResponse>> => api({
      endpoint: `/groups/${queryKey[2]}`,
      schema: getGroupResponse,
      authContext: auth,
      method: "GET",
    }),
  })
}

const responseVoid = union([
  strictObject({
    ok: literal(true),
  }),
  strictObject({
    ok: literal(false),
    error: string(),
  }),
])

type OkVoidResponse = { ok: true }

export type DeleteGroupRequest = {
  id: string
}

export type DeleteGroupResponse = void

export function useDeleteGroup() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: ({ id }: DeleteGroupRequest): Promise<OkVoidResponse> => api({
      endpoint: `/groups/${id}`,
      schema: responseVoid,
      authContext: auth,
      method: "DELETE",
    }),
    onSuccess(_data, _variables, _result, context) {
      context.client.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}

export type AddGroupMemberRequest = {
  id: string
  email: string
}

export type AddGroupMemberResponse = GroupDetails

const addGroupMemberResponse = response(groupDetails)

export function useAddGroupMember() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: ({ id, ...data }: AddGroupMemberRequest): Promise<OkResponse<AddGroupMemberResponse>> => api({
      endpoint: `/groups/${id}/members`,
      schema: addGroupMemberResponse,
      authContext: auth,
      method: "POST",
      body: data,
    }),
    onSuccess(_data, _variables, _result, context) {
      context.client.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}

export type GroupMessage = {
  _id: string
  group: string
  sender: {
    _id: string
    name: string
    email: string
  }
  text: string
  createdAt: Date
  updatedAt: Date
}

const groupMessage = strictObject({
  _id: string(),
  group: string(),
  sender: strictObject({
    _id: string(),
    name: string(),
    email: string(),
  }),
  text: string(),
  createdAt: parseDate,
  updatedAt: parseDate,
  __v: unknown(),
})


export type GetGroupMessagesResponse = GroupMessage[]

const getGroupMessagesResponse = response(array(groupMessage))

export function useGetGroupMessages(id: string) {
  const auth = useAuthContext()

  return useQuery({
    queryKey: ['groups', 'one', id, 'messages'] as const,
    queryFn: ({ queryKey }): Promise<OkResponse<GetGroupMessagesResponse>> => api({
      endpoint: `/groups/${queryKey[2]}/messages`,
      schema: getGroupMessagesResponse,
      authContext: auth,
      method: "GET",
    }),
  })
}

export type CreateGroupMessageRequest = {
  id: string

  text: string
}

export type CreateGroupMessageResponse = GroupMessage

const createGroupMessageResponse = response(groupMessage)

export function useCreateGroupMessage() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: ({ id, ...data }: CreateGroupMessageRequest): Promise<OkResponse<CreateGroupMessageResponse>> => api({
      endpoint: `/groups/${id}/messages`,
      schema: createGroupMessageResponse,
      authContext: auth,
      method: "POST",
      body: data,
    }),
    onSuccess(_data, variables, _result, context) {
      context.client.invalidateQueries({ queryKey: ['groups', 'one', variables.id, 'messages'] })
    },
  })
}

// --- Direct Messages ---

export type DirectMessage = {
  _id: string
  from: string         // user id (ObjectId as string)
  to: string           // user id (ObjectId as string)
  content: string
  createdAt: Date
  updatedAt: Date
}

const directMessage = strictObject({
  _id: string(),
  from: string(),
  to: string(),
  content: string(),
  createdAt: parseDate,
  updatedAt: parseDate,
})

export type GetDirectMessagesResponse = DirectMessage[]

const getDirectMessagesResponse = response(array(directMessage))

// Load conversation between me and otherUserId
export function useGetDirectMessages(otherUserId: string) {
  const auth = useAuthContext()

  return useQuery({
    queryKey: ['directMessages', otherUserId] as const,
    queryFn: (): Promise<OkResponse<GetDirectMessagesResponse>> =>
      api({
        endpoint: `/direct-messages/history`,
        schema: getDirectMessagesResponse,
        authContext: auth,
        method: "POST",
        body: { otherUserId },
      }),
    enabled: !!otherUserId,
    // simple "realtime" via polling every 3 seconds
    refetchInterval: 3000,
  })
}

export type SendDirectMessageRequest = {
  otherUserId: string
  content: string
}

export type SendDirectMessageResponse = DirectMessage

const sendDirectMessageResponse = response(directMessage)

export function useSendDirectMessage() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: (data: SendDirectMessageRequest): Promise<OkResponse<SendDirectMessageResponse>> =>
      api({
        endpoint: `/direct-messages/send`,
        schema: sendDirectMessageResponse,
        authContext: auth,
        method: "POST",
        body: data,
      }),
    onSuccess(_data, variables, _result, context) {
      // refresh that thread after sending
      context.client.invalidateQueries({
        queryKey: ['directMessages', variables.otherUserId],
      })
    },
  })
}

export type Profile = {
  id: string
  name: string
  email: string
  createdAt: Date

  major: string
  department: string
  year: string
  bio: string
  interests: string[]

  notificationSettings: {
    likes: boolean
    comments: boolean
    replies: boolean
    system: boolean
  }

  postsCount: number
  likesGivenCount: number
  likesReceivedCount: number
  commentsReceivedCount: number
}

const profile = strictObject({
  id: string(),
  name: string(),
  email: string(),
  createdAt: parseDate,

  major: string(),
  department: string(),
  year: string(),
  bio: string(),
  interests: array(string()),

  notificationSettings: strictObject({
    likes: boolean(),
    comments: boolean(),
    replies: boolean(),
    system: boolean(),
  }),

  postsCount: number(),
  likesGivenCount: number(),
  likesReceivedCount: number(),
  commentsReceivedCount: number(),
})

export type GetMyProfileResponse = Profile

export function useGetMyProfile() {
  const auth = useAuthContext()

  return useQuery({
    queryKey: ['users', 'me'] as const,
    queryFn: (): Promise<OkResponse<GetMyProfileResponse>> => api({
      endpoint: `/users/me`,
      schema: response(profile),
      authContext: auth,
      method: "GET",
    }),
  })
}

export type UpdateProfileRequest = {
  major?: string
  department?: string
  year?: string
  bio?: string
  interests?: string[]
}

export type UpdateProfileResponse = {
  id: string
  name: string
  email: string
  createdAt: Date

  major: string
  department: string
  year: string
  bio: string
  interests: string[]

  notificationSettings: {
    likes: boolean
    comments: boolean
    replies: boolean
    system: boolean
  }
}

const updateProfileResponse = strictObject({
  id: string(),
  name: string(),
  email: string(),
  createdAt: parseDate,

  major: string(),
  department: string(),
  year: string(),
  bio: string(),
  interests: array(string()),

  notificationSettings: strictObject({
    likes: boolean(),
    comments: boolean(),
    replies: boolean(),
    system: boolean(),
  }),
})

export function useUpdateProfile() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: (data: UpdateProfileRequest): Promise<OkResponse<UpdateProfileResponse>> => api({
      endpoint: `/users/me/profile`,
      schema: response(updateProfileResponse),
      authContext: auth,
      method: "PUT",
      body: data,
    }),
    onSuccess(_data, _variables, _result, context) {
      context.client.invalidateQueries({ queryKey: ['users', 'me'] })
    },
  })
}

export type UpdateSettingsRequest = {
  name?: string
  notificationSettings?: {
    likes?: boolean
    comments?: boolean
    replies?: boolean
    system?: boolean
  }
}

export type UpdateSettingsResponse = {
  id: string
  name: string
  email: string
  notificationSettings: {
    likes: boolean
    comments: boolean
    replies: boolean
    system: boolean
  }
  createdAt: Date
  isDeleted: boolean
}

const updateSettingsResponse = strictObject({
  id: string(),
  name: string(),
  email: string(),
  notificationSettings: strictObject({
    likes: boolean(),
    comments: boolean(),
    replies: boolean(),
    system: boolean(),
  }),
  createdAt: parseDate,
  isDeleted: boolean(),
})

export function useUpdateSettings() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: (data: UpdateSettingsRequest): Promise<OkResponse<UpdateSettingsResponse>> => api({
      endpoint: `/users/settings/account`,
      schema: response(updateSettingsResponse),
      authContext: auth,
      method: "PUT",
      body: data,
    }),
    onSuccess(_data, _variables, _result, context) {
      context.client.invalidateQueries({ queryKey: ['users', 'me'] })
    },
  })
}

export type DiscoverUsersResponse = {
  id: string
  name: string
  email: string
  major: string
  department: string
  year: string
  bio: string
  interests: string[]
  score: number
}[]

const discoverUsersResponse = response(array(strictObject({
  id: string(),
  name: string(),
  email: string(),
  major: string(),
  department: string(),
  year: string(),
  bio: string(),
  interests: array(string()),
  score: number(),
})))

export function useDiscoverUsers() {
  const auth = useAuthContext()

  return useQuery({
    queryKey: ['users', 'discover'] as const,
    queryFn: (): Promise<OkResponse<DiscoverUsersResponse>> => api({
      endpoint: `/users/discover`,
      schema: discoverUsersResponse,
      authContext: auth,
      method: "GET",
    }),
  })
}

type ChangePasswordRequest = {
  currentPassword: string
  newPassword: string
}

export function useChangePassword() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: (data: ChangePasswordRequest): Promise<OkResponseMessage> => api({
      endpoint: `/users/settings/password`,
      schema: responseMessage,
      authContext: auth,
      method: "POST",
      body: data,
    }),
  })
}

export function useDeleteAccount() {
  const auth = useAuthContext()

  return useMutation({
    mutationFn: (): Promise<OkResponseMessage> => api({
      endpoint: `/users/me`,
      schema: responseMessage,
      authContext: auth,
      method: "DELETE",
    }),
    onSuccess(_data, _variables, _result, context) {
      context.client.invalidateQueries()
      auth.loggedOut()
    },
  })
}
