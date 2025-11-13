import CreatePostForm from "~/components/CreatePostForm"
import PostCard from "~/components/PostCard"
import { useState } from "react"
import { getMockPosts } from "~/api/mockApi"
import { Button } from "~/ui/Button";


import { createFileRoute } from '@tanstack/react-router'
import { useLogout } from "~/api/hooks";

export const Route = createFileRoute('/_authenticated/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [posts, setPosts] = useState(getMockPosts());
  const { auth } = Route.useRouteContext()
  const logout = useLogout(auth)

  const handleAddPost = (text: string) => {
    setPosts([
      { id: Date.now(), author: auth.user!.user.name, content: text, edited: false },
      ...posts,
    ]);
  };

  const handleDelete = (id: number) => {
    setPosts(posts.filter((p) => p.id !== id));
  };

  const handleEdit = (id: number, newText: string) => {
    setPosts(
      posts.map((p) =>
        p.id === id ? { ...p, content: newText, edited: true } : p
      )
    );
  };

  return (
    <>
      <nav className="flex flex-row items-center justify-between bg-fuchsia-200 dark:bg-stone-800 p-2">
        <span>Campus Connect, {auth.user!.user.name}</span>

        <Button onPress={() => logout.mutate()}>
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
                canEdit={p.author === auth.user!.user.name}
                onDelete={() => handleDelete(p.id)}
                onEdit={(newText: string) => handleEdit(p.id, newText)}
              />
            ))
          )}
        </section>
      </div>
    </>

  )
}
