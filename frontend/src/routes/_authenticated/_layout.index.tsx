import CreatePostForm from "~/components/CreatePostForm";
import PostCard from "~/components/PostCard";
import { MyGroupsList } from "~/components/MyGroupsList";
import { createFileRoute } from "@tanstack/react-router";
import {
  useGetFeedPosts,
  OkResponse,
  Post,
  useGetTrendingPosts,
  useMyPosts,
} from "~/api/hooks";
import { StandardErrorBox } from "~/ui/ErrorBox";
import { ProgressBar } from "~/ui/ProgressBar";
import { Tab, TabList, TabPanel, Tabs } from "~/ui/Tabs";
import { UseQueryResult } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/_layout/")({
  component: RouteComponent,
  loader: () => ({
    title: 'Campus Connect'
  }),
});

function PostFeed({ posts }: { posts: UseQueryResult<OkResponse<Post[]>> }) {
  const { isPending, data, error } = posts;

  return (
    <>
      <StandardErrorBox
        error={error}
        explanation="Failed to load trending posts"
        className="mt-12"
      />

      {isPending && (
        <ProgressBar
          label="Loading posts..."
          className="mt-12"
          isIndeterminate
        />
      )}

      {data !== undefined && (
        <section className="space-y-4">
          {data.data.length === 0 ? (
            <p>No posts yet — share something with your friends!</p>
          ) : (
            data.data.map((p) => <PostCard key={p._id} post={p} />)
          )}
        </section>
      )}
    </>
  );
}

function RouteComponent() {
  const feedPosts = useGetFeedPosts();
  const trendingPosts = useGetTrendingPosts();
  const myPosts = useMyPosts();

  return (
    <>
      <div className="flex flex-col lg:w-full lg:max-w-2xl lg:mx-auto py-6">
        <CreatePostForm />

        <MyGroupsList />

        <Tabs className="pt-12">
          <TabList aria-label="Post categories">
            <Tab id="trending">Hottest Posts</Tab>
            <Tab id="feed">Recent Posts</Tab>
            <Tab id="mine">My Posts</Tab>
          </TabList>
          <TabPanel id="trending">
            <PostFeed posts={trendingPosts} />
          </TabPanel>
          <TabPanel id="feed">
            <PostFeed posts={feedPosts} />
          </TabPanel>
          <TabPanel id="mine">
            <PostFeed posts={myPosts} />
          </TabPanel>
        </Tabs>
      </div>
    </>
  );
}
