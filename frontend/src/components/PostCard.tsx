import { FormEvent, useState } from "react"
import { TextAreaField, TextField } from "../ui/TextField"
import { Button } from "../ui/Button"
import { type Comment, Post, useAddComment, useAuthContext, useDeletePost, useEditPost, useToggleLike, useDeleteComment, useReplyToComment, useReportComment, useReportPost, useToggleBlock } from "~/api/hooks"
import { formatDistanceToNow } from "date-fns"
import { Form } from "~/ui/Form"
import { Heading, MenuTrigger, TooltipTrigger } from "react-aria-components"
import { Menu, MenuItem } from "~/ui/Menu"
import { EllipsisVertical, Eraser, FlagTriangleRight, Heart, MessageCircle, Pencil, Reply, ShieldMinus } from "lucide-react"
import { StandardErrorBox } from "~/ui/ErrorBox"
import { Tooltip } from "~/ui/Tooltip"
import { tv } from "tailwind-variants"
import { Modal } from "~/ui/Modal"
import { Dialog } from "~/ui/Dialog"
import { UseMutationResult } from "@tanstack/react-query"

const commentStyles = tv({
  base: "border border-2 shadow-md border-fuchsia-200 dark:border-stone-800 dark:bg-stone-800/50 bg-fuchsia-200/50 rounded-lg",
  variants: {
    isPending: {
      true: "opacity-50",
    },
  },
})

function ReportPopup<const TResponse>({ open, setOpen, title, body, author, submitReport, mutation }: { open: boolean; setOpen(open: boolean): void; title?: string; body: string; author: string; submitReport(e: string): Promise<void>, mutation: UseMutationResult<unknown, Error, TResponse, unknown> }) {
  const [reasonText, setReasonText] = useState("")
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!e.currentTarget.checkValidity()) {
      return
    }

    await submitReport(reasonText)
    setReasonText("")
    setOpen(false)
  }

  return (
    <Modal isDismissable isOpen={open} onOpenChange={setOpen}>
      <Dialog>
        <Heading slot="title" className="text-xl font-bold pb-4">Confirm report</Heading>

        <div className={commentStyles()}>
          <div className="p-4">
            <strong>{author}</strong>
            {title && <div className="text-lg font-bold">{title}</div>}
            <div>{body}</div>
          </div>
        </div>

        <Form onSubmit={handleSubmit} className="flex flex-col space-y-2 pt-4">
          <TextAreaField
            placeholder="Write a reason for the report. (Optional)"
            value={reasonText}
            onChange={setReasonText}
            isRequired
            isDisabled={mutation.isPending}
          />

          <Button variant="destructive" type="submit" isPending={mutation.isPending}>Report</Button>
          <Button variant="secondary" slot="close">Cancel</Button>

          <StandardErrorBox explanation="Failed to submit report" error={mutation.error} />
        </Form>

      </Dialog>
    </Modal>
  )
}

function Comment({ post, comment }: { post: Post; comment: Comment }) {
  const auth = useAuthContext()
  const deleteComment = useDeleteComment()
  const replyToComment = useReplyToComment()
  const reportComment = useReportComment()
  const canEdit = auth.user?.user.id === comment.user
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [reportOpen, setReportOpen] = useState(false)

  const handleSubmitReply = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!e.currentTarget.checkValidity()) {
      return
    }

    if (!replyText.trim().length) {
      return
    }

    await replyToComment.mutateAsync({ postId: post._id, commentId: comment._id, text: replyText })
    setReplyText("")
    setIsReplying(false)
  }

  const handleReportComment = async (e: string) => {
    await reportComment.mutateAsync({ postId: post._id, commentId: comment._id, reason: e })
  }

  return (
    <div className={commentStyles({ isPending: deleteComment.isPending || deleteComment.isSuccess })}>
      <div className="p-2 pb-0 flex flex-row justify-between items-center">
        <div className="flex flex-row space-x-2 items-baseline">
          <strong>{comment.userName}</strong>
          <span className="text-sm opacity-50">{formatDistanceToNow(comment.createdAt, { addSuffix: true })}</span>
        </div>
        <MenuTrigger>
          <Button variant="icon"><EllipsisVertical size={16} /></Button>
          <Menu>
            <MenuItem isDisabled={!canEdit} onAction={() => deleteComment.mutate({ postId: post._id, commentId: comment._id })}><Eraser size={16} /> Delete</MenuItem>
            <MenuItem onAction={() => setIsReplying(true)}><Reply size={16} /> Reply</MenuItem>
            <MenuItem onAction={() => setReportOpen(true)}><FlagTriangleRight size={16} /> Report</MenuItem>
          </Menu>
        </MenuTrigger>
      </div>
      <ReportPopup open={reportOpen} setOpen={setReportOpen} body={comment.text} author={comment.userName} submitReport={e => handleReportComment(e)} mutation={reportComment} />
      <div className="p-2">
        {comment.text}
      </div>
      {comment.replies.length > 0 &&
        <div className="border-t-2 border-fuchsia-200 dark:border-stone-800 p-4 flex flex-col space-y-2">
          {comment.replies
            .filter(reply => !auth.user?.user.blockedUsers?.includes(reply.user))
            .map(reply =>
            <div className={commentStyles()}>
              <div className="p-2">
                <div className="flex flex-row space-x-2 items-baseline">
                  <strong>{reply.userName}</strong>
                  <span className="text-sm opacity-50">{formatDistanceToNow(reply.createdAt, { addSuffix: true })}</span>
                </div>
                {reply.text}
              </div>
            </div>
          )}
        </div>
      }
      {isReplying &&
        <div className="border-t-2 border-fuchsia-200 dark:border-stone-800 p-4">
          <Form onSubmit={handleSubmitReply} className="flex flex-col space-y-2">
            <TextAreaField
              placeholder="Write a reply. Be nice!"
              value={replyText}
              onChange={setReplyText}
              isRequired
              isDisabled={replyToComment.isPending}
            />
            <div className="self-end flex flex-row space-x-2">
              <Button type="submit" variant="secondary" isPending={replyToComment.isPending}>Reply</Button>
              <Button variant="secondary" onPress={() => setIsReplying(false)}>Cancel</Button>
            </div>
            <StandardErrorBox explanation="Failed to submit reply:" error={replyToComment.error} />
          </Form>
        </div>
      }
    </div>
  )
}

function BlockPopup({ open, setOpen, authorName, authorId }: { open: boolean; setOpen(open: boolean): void; authorName: string; authorId: string }) {
  const blockUser = useToggleBlock()

  return (
    <Modal isDismissable isOpen={open} onOpenChange={setOpen}>
      <Dialog>
        <Heading slot="title" className="text-xl font-bold pb-4">
          Block {authorName}?
        </Heading>

        <div className="p-4">
          <p>
            Once blocked, you will no longer see this user’s posts or comments.
            You can unblock them later in your profile settings.
          </p>
        </div>

        <div className="flex flex-col space-y-2 pt-4">
          <Button variant="destructive" onPress={() => blockUser.mutate({ id: authorId })} isPending={blockUser.isPending}>
            Block User
          </Button>
          <Button variant="secondary" slot="close">
            Cancel
          </Button>
        </div>
      </Dialog>
    </Modal>
  );
}

export default function PostCard({ post }: { post: Post }) {
  const auth = useAuthContext()
  const [isEditing, setIsEditing] = useState(false)
  const [showingComments, setShowingComments] = useState(false)
  const [titleText, setTitleText] = useState(post.title)
  const [bodyText, setBodyText] = useState(post.body)
  const [commentText, setCommentText] = useState("")
  const [reportOpen, setReportOpen] = useState(false)
  const canEdit = auth.user?.user.id === post.author

  const editPost = useEditPost()
  const deletePost = useDeletePost()
  const likePost = useToggleLike()
  const addComment = useAddComment()
  const reportPost = useReportPost()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!e.currentTarget.checkValidity()) {
      return
    }
    if (!titleText.trim().length || !bodyText.trim().length) {
      return
    }

    setIsEditing(false)
    try
    {
      await editPost.mutateAsync({ id: post._id, title: titleText, body: bodyText })
    }
    catch
    {
      setIsEditing(true)
    }
  }

  const handleSubmitComment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!e.currentTarget.checkValidity()) {
      return
    }

    if (!commentText.trim().length) {
      return
    }

    await addComment.mutateAsync({ id: post._id, text: commentText })
    setCommentText("")
  }

  const edit = () => {
    setTitleText(post.title)
    setBodyText(post.body)
    setIsEditing(true)
  }

  const handleReportPost = async (e: string) => {
    await reportPost.mutateAsync({ id: post._id, reason: e })
  }

  const changePending = editPost.isPending || deletePost.isPending || likePost.isPending

  const [blockOpen, setBlockOpen] = useState(false);
  
  return (
    <div className="border border-2 shadow-md border-fuchsia-200 dark:border-stone-800 dark:bg-stone-800/50 bg-fuchsia-200/50 rounded-lg">
      <div className="flex flex-row justify-between items-center p-4 pb-0">
        <div className="flex flex-row space-x-2 items-baseline">
          <strong>{post.authorName}</strong>
          <span className="text-sm opacity-50">{formatDistanceToNow(post.createdAt, { addSuffix: true })}</span>
          {post.edited && <span className="text-sm opacity-50 italic"> (Edited {formatDistanceToNow(post.updatedAt, { addSuffix: true })})</span>}
        </div>
        <MenuTrigger>
          <Button variant="icon"><EllipsisVertical /></Button>
          <Menu>
            <MenuItem isDisabled={!canEdit} onAction={() => edit()}><Pencil size={16} /> Edit</MenuItem>
            <MenuItem isDisabled={!canEdit} onAction={() => deletePost.mutate({ id: post._id })}><Eraser size={16} /> Delete</MenuItem>
            <MenuItem onAction={() => setReportOpen(true)}><FlagTriangleRight size={16} /> Report</MenuItem>
            <MenuItem isDisabled={auth.user!.user.id === post.author} onAction={() => setBlockOpen(true)}>
            <ShieldMinus size={16} />{auth.user?.user?.blockedUsers?.includes(post.author) ? "Unblock" : "Block"}</MenuItem>
          </Menu>
        </MenuTrigger>
      </div>

      <ReportPopup open={reportOpen} setOpen={setReportOpen} title={post.title} body={post.body} author={post.authorName} submitReport={e => handleReportPost(e)} mutation={reportPost} />
      <BlockPopup open={blockOpen} setOpen={setBlockOpen} authorName={post.authorName} authorId={post.author} />
      
      {isEditing ? (
        <Form onSubmit={handleSubmit} className="p-4 pt-0">
          <TextField
            value={titleText}
            onChange={setTitleText}
            className="my-2"
            isRequired
          />
          <TextAreaField
            value={bodyText}
            onChange={setBodyText}
            isRequired
          />
          <StandardErrorBox explanation="Failed to edit post" error={editPost.error} />
          <div className="flex flex-row justify-end space-x-2">
            <Button type="submit" variant="secondary">Save</Button>
            <Button variant="secondary" onPress={() => setIsEditing(false)}>Cancel</Button>
          </div>
        </Form>
      ) : (
        <div className={changePending ? "opacity-50 p-4 pt-0" : "p-4 pt-0"}>
          <h2 className="my-2 text-lg font-bold">{post.title}</h2>
          <p className="my-2">
            {post.body}
          </p>
          <div className="flex flex-row justify-end space-x-2">
            <TooltipTrigger delay={100}>
              <Button variant="icon" onPress={() => likePost.mutate({ id: post._id })}><Heart fill={post.likes.includes(auth.user!.user.id) ? "currentColor" : "none"} /> <span className="pl-2 text-lg">{post.likes.length}</span></Button>
              <Tooltip>
                {post.likes.length === 0 && "Nobody has liked this post so far. Be the first!"}
                {post.likes.length > 0 && (
                  <ul>
                    {post.likes.map(like => <li>{like}</li>)}
                  </ul>
                )}
              </Tooltip>
            </TooltipTrigger>
            <Button variant="icon" onPress={() => setShowingComments(it => !it)}><MessageCircle /> <span className="pl-2 text-lg">{post.comments.length}</span></Button>
          </div>
        </div>
      )}
      <StandardErrorBox explanation="Failed to delete post" error={deletePost.error} />
      {showingComments &&
        <>
          <div className="border-t-2 border-fuchsia-200 dark:border-stone-800 p-4">
            {post.comments.length === 0 && <div>Nobody has commented on this post so far. Be the first!</div>}
            <div className="flex flex-col space-y-2">
              {post.comments.map(comment => <Comment post={post} comment={comment} />)}
            </div>
          </div>
          <div className="border-t-2 border-fuchsia-200 dark:border-stone-800 p-4">
            <Form onSubmit={handleSubmitComment} className="flex flex-col space-y-2">
              <TextAreaField
                placeholder="Write a comment. Be nice!"
                value={commentText}
                onChange={setCommentText}
                isRequired
                isDisabled={addComment.isPending}
              />
              <Button className="self-end" type="submit" variant="secondary" isPending={addComment.isPending}>Comment</Button>
              <StandardErrorBox explanation="Failed to submit comment:" error={addComment.error} />
            </Form>
          </div>
        </>
      }
    </div>
  );
}
