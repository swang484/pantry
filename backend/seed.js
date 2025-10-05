const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Create sample profiles
    const profiles = await Promise.all([
        prisma.profile.upsert({
            where: { username: 'john_doe' },
            update: {},
            create: {
                name: 'John Doe',
                username: 'john_doe',
                email: 'john@example.com',
                avatar: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop&crop=face',
                bio: 'Your friendly neighborhood home cook! Love experimenting with pantry ingredients.'
            }
        }),
        prisma.profile.upsert({
            where: { username: 'sophia' },
            update: {},
            create: {
                name: 'Sophia',
                username: 'sophia',
                email: 'sophia@example.com',
                avatar: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=150&h=150&fit=crop&crop=face',
                bio: 'Food enthusiast and home chef. Love creating delicious meals from simple ingredients!'
            }
        }),
        prisma.profile.upsert({
            where: { username: 'amber' },
            update: {},
            create: {
                name: 'Amber',
                username: 'amber',
                email: 'amber@example.com',
                avatar: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=150&h=150&fit=crop&crop=face',
                bio: 'Turning pantry staples into gourmet meals. Follow for creative cooking tips!'
            }
        }),
        prisma.profile.upsert({
            where: { username: 'annabel' },
            update: {},
            create: {
                name: 'Annabel',
                username: 'annabel',
                email: 'annabel@example.com',
                avatar: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=150&h=150&fit=crop&crop=face',
                bio: 'Learning to cook with whatever I have in my pantry. Sharing my journey!'
            }
        })
    ]);

    console.log(`✅ Created ${profiles.length} profiles`);

    // Create sample posts
    const posts = await Promise.all([
        prisma.post.create({
            data: {
                title: 'Quick Pantry Pasta',
                description: 'Made this amazing pasta dish with just tomatoes, garlic, and olive oil from my pantry. Sometimes the simplest ingredients create the most satisfying meals!',
                image: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=500&h=400&fit=crop',
                profileId: profiles[0].id
            }
        }),
        prisma.post.create({
            data: {
                title: 'Rice Bowl Masterpiece',
                description: 'Transformed leftover rice into this beautiful bowl with eggs, vegetables, and soy sauce. Zero waste cooking at its finest!',
                image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500&h=400&fit=crop',
                profileId: profiles[1].id
            }
        }),
        prisma.post.create({
            data: {
                title: 'My First Homemade Bread',
                description: 'Used flour, yeast, and water from my pantry to make this bread. I was so nervous but it turned out perfect! The smell filled my entire apartment.',
                image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=500&h=400&fit=crop',
                profileId: profiles[2].id
            }
        }),
        prisma.post.create({
            data: {
                title: 'Pantry Soup Surprise',
                description: 'Created this hearty soup using canned beans, frozen vegetables, and spices from my pantry. It\'s amazing what you can create with basic staples!',
                image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&h=400&fit=crop',
                profileId: profiles[0].id
            }
        }),
        prisma.post.create({
            data: {
                title: 'Emergency Meal: Quesadillas',
                description: 'When you need dinner in 10 minutes, quesadillas with cheese and tortillas from your pantry are the answer. Added some leftover chicken for extra protein!',
                image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=500&h=400&fit=crop',
                profileId: profiles[1].id
            }
        })
    ]);

    console.log(`✅ Created ${posts.length} posts`);

    // Create sample likes
    const likes = await Promise.all([
        prisma.like.create({
            data: {
                postId: posts[0].id,
                profileId: profiles[1].id
            }
        }),
        prisma.like.create({
            data: {
                postId: posts[0].id,
                profileId: profiles[2].id
            }
        }),
        prisma.like.create({
            data: {
                postId: posts[1].id,
                profileId: profiles[0].id
            }
        }),
        prisma.like.create({
            data: {
                postId: posts[1].id,
                profileId: profiles[2].id
            }
        }),
        prisma.like.create({
            data: {
                postId: posts[2].id,
                profileId: profiles[0].id
            }
        }),
        prisma.like.create({
            data: {
                postId: posts[2].id,
                profileId: profiles[1].id
            }
        }),
        prisma.like.create({
            data: {
                postId: posts[3].id,
                profileId: profiles[1].id
            }
        }),
        prisma.like.create({
            data: {
                postId: posts[4].id,
                profileId: profiles[0].id
            }
        })
    ]);

    console.log(`✅ Created ${likes.length} likes`);

    // Create sample comments
    const comments = await Promise.all([
        prisma.comment.create({
            data: {
                content: 'This looks absolutely delicious! I have all these ingredients in my pantry too. Will definitely try this recipe!',
                postId: posts[0].id,
                profileId: profiles[1].id
            }
        }),
        prisma.comment.create({
            data: {
                content: 'Love the simplicity of this dish. Sometimes less is more in cooking!',
                postId: posts[0].id,
                profileId: profiles[2].id
            }
        }),
        prisma.comment.create({
            data: {
                content: 'Your rice bowl looks amazing! I\'m always looking for ways to use leftover rice. Thanks for the inspiration!',
                postId: posts[1].id,
                profileId: profiles[0].id
            }
        }),
        prisma.comment.create({
            data: {
                content: 'That bread looks perfect! I\'ve been too scared to try making bread but this gives me confidence.',
                postId: posts[2].id,
                profileId: profiles[0].id
            }
        }),
        prisma.comment.create({
            data: {
                content: 'Homemade bread is so rewarding! The key is not to rush the rising process.',
                postId: posts[2].id,
                profileId: profiles[1].id
            }
        }),
        prisma.comment.create({
            data: {
                content: 'Emergency meals are the best! Quick, tasty, and uses what you have. Great tip!',
                postId: posts[4].id,
                profileId: profiles[2].id
            }
        })
    ]);

    console.log(`✅ Created ${comments.length} comments`);

    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - ${profiles.length} profiles`);
    console.log(`   - ${posts.length} posts`);
    console.log(`   - ${likes.length} likes`);
    console.log(`   - ${comments.length} comments`);
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
