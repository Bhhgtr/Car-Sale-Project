import React from 'react';

export default function About() {
  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Heading */}
        <h1 className="text-4xl font-bold text-center mb-6 text-gray-800">
          About Us
        </h1>

        {/* Intro */}
        <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto mb-10">
          Welcome to Exotic Cars — your trusted partner in buying, renting and selling vehicles.
          We are committed to providing high-quality cars, transparent pricing, and
          a seamless customer experience.
        </p>

        {/* Mission + Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white shadow-md rounded-2xl p-6">
            <h2 className="text-2xl font-semibold mb-3 text-gray-800">
              Our Mission
            </h2>
            <p className="text-gray-600">
              To make vehicle buying and selling simple, trustworthy, and accessible
              for everyone by offering a wide range of reliable cars and exceptional service.
            </p>
          </div>

          <div className="bg-white shadow-md rounded-2xl p-6">
            <h2 className="text-2xl font-semibold mb-3 text-gray-800">
              Our Vision
            </h2>
            <p className="text-gray-600">
              To become a leading platform in the automotive marketplace by combining
              technology, trust, and customer-first experiences.
            </p>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
            Why Choose Us?
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white shadow-md rounded-2xl p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">Wide Selection</h3>
              <p className="text-gray-600">
                From budget-friendly cars to premium vehicles, we offer options for every need.
              </p>
            </div>

            <div className="bg-white shadow-md rounded-2xl p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">Trusted Listings</h3>
              <p className="text-gray-600">
                Every listing is verified to ensure quality and transparency.
              </p>
            </div>

            <div className="bg-white shadow-md rounded-2xl p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">Easy Process</h3>
              <p className="text-gray-600">
                Buy or sell your vehicle quickly with our simple and secure platform.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white shadow-md rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            Our Impact
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-3xl font-bold text-blue-600">5K+</p>
              <p className="text-gray-600">Cars Sold</p>
            </div>

            <div>
              <p className="text-3xl font-bold text-blue-600">3K+</p>
              <p className="text-gray-600">Happy Customers</p>
            </div>

            <div>
              <p className="text-3xl font-bold text-blue-600">1K+</p>
              <p className="text-gray-600">Active Listings</p>
            </div>

            <div>
              <p className="text-3xl font-bold text-blue-600">4.8★</p>
              <p className="text-gray-600">Customer Rating</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}