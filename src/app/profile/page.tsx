import Layout from "../components/Layout";

export default function Profile() {
    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600">Profile page content will go here...</p>
                </div>
            </div>
        </Layout>
    );
}
