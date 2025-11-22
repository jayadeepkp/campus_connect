import { FormEvent, useState } from "react"
import { Form } from "../ui/Form"
import { TextAreaField, TextField } from "../ui/TextField"
import { Button } from "../ui/Button";
import { useCreatePost } from "~/api/hooks";
import { StandardErrorBox } from "~/ui/ErrorBox";

export default function CreatePostForm() {
  const { mutateAsync, isPending, error } = useCreatePost()
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!e.currentTarget.checkValidity()) {
      return
    }

    if (!title.trim().length || !body.trim().length) {
      return
    }

    await mutateAsync({ title, body })
    setTitle("")
    setBody("")
  };

  return (
    <Form onSubmit={handleSubmit} className="create-post">
      <TextField
        placeholder="Title your post..."
        value={title}
        onChange={setTitle}
        isRequired
        isDisabled={isPending}
      />
      <TextAreaField
        placeholder="Share your thoughts..."
        value={body}
        onChange={setBody}
        isRequired
        isDisabled={isPending}
      />
      <Button type="submit" isPending={isPending}>Post</Button>
      <StandardErrorBox explanation="Failed to create post" error={error} />
    </Form>
  );
}
