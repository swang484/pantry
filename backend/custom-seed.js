const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addCustomData() {
    console.log('🌱 Adding custom data...');

    try {
        // Example: Add a new profile
        const newProfile = await prisma.profile.create({
            data: {
                name: 'Your Name Here',
                username: 'your_username',
                email: 'your@email.com',
                avatar: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop&crop=face',
                bio: 'Your custom bio here!'
            }
        });
        console.log('✅ Created profile:', newProfile.name);

        // Example: Add a new post
        const newPost = await prisma.post.create({
            data: {
                title: 'Your Custom Post Title',
                description: 'Your custom post description here. Tell us about your cooking!',
                image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500&h=400&fit=crop',
                profileId: newProfile.id // Link to the profile you just created
            }
        });
        console.log('✅ Created post:', newPost.title);

        // Example: Update existing data
        const updatedProfile = await prisma.profile.update({
            where: { username: 'sophia' },
            data: {
                bio: 'Updated bio for Sophia!'
            }
        });
        console.log('✅ Updated profile:', updatedProfile.name);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the function
addCustomData();
