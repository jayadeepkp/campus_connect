import { useState } from "react"
import { Form } from "../ui/Form"
import { TextAreaField } from "../ui/TextField"
import { Button } from "../ui/Button";

export default function CreatePostForm({ onPost }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onPost(text);
      setText("");
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="create-post">
      <TextAreaField
        placeholder="Share something..."
        value={text}
        onChange={setText}
      />
      <Button type="submit">Post</Button>
    </Form>
  );
}
