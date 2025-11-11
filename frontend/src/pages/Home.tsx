import { useState } from "react"
import CreatePostForm from "../components/CreatePostForm"
import PostCard from "../components/PostCard"
import { getMockPosts } from "../api/mockApi"
import { Button } from "../ui/Button";

export default function Home({ user, onLogout }) {
  const [posts, setPosts] = useState(getMockPosts());

  const handleAddPost = (text) => {
    setPosts([
      { id: Date.now(), author: user.name, content: text, edited: false },
      ...posts,
    ]);
  };

  const handleDelete = (id) => {
    setPosts(posts.filter((p) => p.id !== id));
  };

  const handleEdit = (id, newText) => {
    setPosts(
      posts.map((p) =>
        p.id === id ? { ...p, content: newText, edited: true } : p
      )
    );
  };

  return (
    <>
      <nav className="flex flex-row items-center justify-between bg-fuchsia-200 dark:bg-stone-800 p-2">
        <span>Campus Connect, {user.name}</span>

        <Button onPress={onLogout}>
          Log Out
        </Button>
      </nav>

      <div className="flex flex-col lg:w-full lg:max-w-lg lg:mx-auto py-6">
        {/* Post creation form */}
        <CreatePostForm onPost={handleAddPost} />

        {/* Feed */}
        <section className="pt-12 space-y-4">
          {posts.length === 0 ? (
            <p>
              No posts yet — share something with your friends!
            </p>
          ) : (
            posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                canEdit={p.author === user.name}
                onDelete={() => handleDelete(p.id)}
                onEdit={(newText) => handleEdit(p.id, newText)}
              />
            ))
          )}
        </section>
      </div>
    </>
  );
}
