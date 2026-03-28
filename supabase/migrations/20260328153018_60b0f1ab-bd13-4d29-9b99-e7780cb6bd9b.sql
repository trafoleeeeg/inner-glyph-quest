
-- Update post counters to match actual likes and comments
UPDATE posts SET 
  likes_count = (SELECT count(*) FROM post_likes WHERE post_likes.post_id = posts.id),
  comments_count = (SELECT count(*) FROM post_comments WHERE post_comments.post_id = posts.id);

-- Update profile follower/following counts
UPDATE profiles SET
  followers_count = (SELECT count(*) FROM follows WHERE follows.following_id = profiles.user_id),
  following_count = (SELECT count(*) FROM follows WHERE follows.follower_id = profiles.user_id),
  posts_count = (SELECT count(*) FROM posts WHERE posts.user_id = profiles.user_id);
