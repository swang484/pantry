const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function quickOperations() {
    console.log('🔧 Quick Database Operations');
    console.log('Choose an operation:');
    console.log('1. Add a new post');
    console.log('2. Update a profile');
    console.log('3. Delete a post');
    console.log('4. List all profiles');
    console.log('5. List all posts');

    // Example operations - modify these as needed:

    // 1. Add a new post
    async function addPost(title, description, imageUrl, username) {
        const profile = await prisma.profile.findUnique({
            where: { username }
        });

        if (!profile) {
            console.log(`❌ Profile ${username} not found`);
            return;
        }

        const post = await prisma.post.create({
            data: {
                title,
                description,
                image: imageUrl,
                profileId: profile.id
            }
        });

        console.log(`✅ Created post: "${title}" by ${profile.name}`);
        return post;
    }

    // 2. Update a profile
    async function updateProfile(username, updates) {
        const profile = await prisma.profile.update({
            where: { username },
            data: updates
        });

        console.log(`✅ Updated profile: ${profile.name}`);
        return profile;
    }

    // 3. Delete a post
    async function deletePost(postId) {
        const post = await prisma.post.delete({
            where: { id: postId }
        });

        console.log(`✅ Deleted post: "${post.title}"`);
        return post;
    }

    // 4. List profiles
    async function listProfiles() {
        const profiles = await prisma.profile.findMany({
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                _count: {
                    select: {
                        posts: true,
                        likes: true,
                        comments: true
                    }
                }
            }
        });

        console.log('\n📋 All Profiles:');
        profiles.forEach((profile, i) => {
            console.log(`${i + 1}. ${profile.name} (@${profile.username})`);
            console.log(`   Posts: ${profile._count.posts}, Likes: ${profile._count.likes}, Comments: ${profile._count.comments}`);
        });

        return profiles;
    }

    // 5. List posts
    async function listPosts() {
        const posts = await prisma.post.findMany({
            include: {
                profile: {
                    select: { name: true, username: true }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log('\n📝 All Posts:');
        posts.forEach((post, i) => {
            console.log(`${i + 1}. "${post.title}" by ${post.profile.name}`);
            console.log(`   Likes: ${post._count.likes}, Comments: ${post._count.comments}`);
        });

        return posts;
    }

    // Example usage - uncomment and modify as needed:

    // await addPost(
    //     'My Amazing Recipe',
    //     'This is a description of my amazing recipe...',
    //     'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500&h=400&fit=crop',
    //     'sophia'
    // );

    // await updateProfile('sophia', {
    //     bio: 'Updated bio for Sophia!'
    // });

    // await deletePost(7); // Replace 7 with actual post ID

    // await listProfiles();
    // await listPosts();

    console.log('\n💡 To use these functions, uncomment the examples above and modify them.');
    console.log('💡 Or call them directly: await addPost(...)');
}

quickOperations()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
