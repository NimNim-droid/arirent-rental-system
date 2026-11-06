import { Link } from "react-router";

import { Button } from "@/components/ui/button";

import myImg from "@/assets/Modern.png";
import Manage from "@/assets/Management.png";
import House from "@/assets/House.png";
import Persons from "@/assets/Persons.png";
import Wallet from "@/assets/Wallet.png";
import Maintain from "@/assets/Maintain.png";

export function Homes() {
  return (
    <>
      <section className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 xl:gap-24 px-5 sm:px-8 lg:px-12 py-12 lg:py-16">
        {/* Hero Text */}
        <div className="w-full lg:w-1/2 max-w-xl">
          <div className="inline-flex items-center gap-2 text-sm sm:text-base text-blue-700 bg-blue-100 rounded-2xl px-4 py-2 mb-8">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <path
                d="M9 21V13.6C9 13.0399 9 12.7599 9.109 12.546C9.20487 12.3578 9.35785 12.2049 9.54601 12.109C9.75993 12 10.04 12 10.6 12H13.4C13.9601 12 14.2401 12 14.454 12.109C14.6422 12.2049 14.7951 12.3578 14.891 12.546C15 12.7599 15 13.0399 15 13.6V21M2 9.5L11.04 2.72C11.3843 2.46181 11.5564 2.33271 11.7454 2.28294C11.9123 2.23902 12.0877 2.23902 12.2546 2.28295C12.4436 2.33271 12.6157 2.46181 12.96 2.72L22 9.5M4 8V17.8C4 18.9201 4 19.4802 4.21799 19.908C4.40974 20.2843 4.7157 20.5903 5.09202 20.782C5.51985 21 6.0799 21 7.2 21H16.8C17.9201 21 18.4802 21 18.908 20.782C19.2843 20.5903 19.5903 20.2843 19.782 19.908C20 19.4801 20 18.9201 20 17.8V8L13.92 3.44C13.2315 2.92361 12.8872 2.66542 12.5091 2.56589C12.1754 2.47804 11.8246 2.47804 11.4909 2.56589C11.1128 2.66542 10.7685 2.92361 10.08 3.44L4 8Z"
                stroke="blue"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Smart Rental Management System
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            Manage Your
            <span className="block text-blue-700 mt-2">Rental Properties</span>
            <span className="block mt-2">With Ease.</span>
          </h1>

          <p className="mt-6 mb-8 text-gray-500 text-sm sm:text-base leading-relaxed">
            AriRent is a simple rental management system designed to help
            property owners manage properties, tenants, billing, utilities, and
            maintenance - all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/register" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto mt-1">Get Started ➔</Button>
            </Link>

            <a href="#Feature" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto mt-1 bg-white text-blue-700 border hover:bg-hover hover:border-blue-500 active:scale-[0.98]">
                Learn More
              </Button>
            </a>
          </div>
        </div>

        {/* Hero Image */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <img
            src={myImg}
            alt="Modern House"
            className="w-full max-w-lg lg:max-w-none h-auto object-contain"
          />
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section
        id="Feature"
        className="flex flex-col items-center bg-white/10 py-14 sm:py-20 px-5 sm:px-8"
      >
        <div className="text-2xl sm:text-3xl font-bold mb-4 text-blue-700 text-center">
          OUR FEATURES
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center leading-tight">
          Everything You Need for
          <span className="block mt-2">Rental Management</span>
        </h2>

        <p className="mt-6 mb-10 text-gray-500 text-center text-sm sm:text-base max-w-2xl">
          AriRent provides all the essential tools to help you manage your
          rental business efficiently and effortlessly.
        </p>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 w-full max-w-7xl">
          {/* Property Management */}
          <div className="rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition">
            <img
              src={House}
              alt="House Icon"
              className="w-16 h-16 object-contain"
            />

            <h3 className="text-lg sm:text-xl mt-5 font-bold">
              Property Management
            </h3>

            <p className="mt-4 text-gray-500 text-sm leading-relaxed">
              Manage properties, rooms, and rental information.
            </p>
          </div>

          {/* Tenant Management */}
          <div className="rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition">
            <img
              src={Persons}
              alt="Persons Icon"
              className="w-16 h-16 object-contain"
            />

            <h3 className="text-lg sm:text-xl mt-5 font-bold">
              Tenant Management
            </h3>

            <p className="mt-4 text-gray-500 text-sm leading-relaxed">
              Keep tenant records organized and accessible.
            </p>
          </div>

          {/* Billing */}
          <div className="rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition">
            <img
              src={Wallet}
              alt="Wallet Icon"
              className="w-16 h-16 object-contain"
            />

            <h3 className="text-lg sm:text-xl mt-5 font-bold">
              Billing & Utilities
            </h3>

            <p className="mt-4 text-gray-500 text-sm leading-relaxed">
              Track rent, utility readings, and tenant bills.
            </p>
          </div>

          {/* Maintenance */}
          <div className="rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition">
            <img
              src={Maintain}
              alt="Maintenance Icon"
              className="w-16 h-16 object-contain"
            />

            <h3 className="text-lg sm:text-xl mt-5 font-bold">
              Maintenance Management
            </h3>

            <p className="mt-4 text-gray-500 text-sm leading-relaxed">
              Monitor maintenance requests and property issues.
            </p>
          </div>
        </div>
      </section>

      {/* WHY ARIRENT SECTION */}
      <section className="flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16 px-5 sm:px-8 lg:px-12 py-14 sm:py-20">
        {/* Management Image */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <img
            src={Manage}
            alt="Rental Management"
            className="w-full max-w-lg lg:max-w-none h-auto object-contain"
          />
        </div>

        {/* Content */}
        <div className="w-full lg:w-1/2 max-w-xl">
          <div className="text-xl font-bold mb-5 text-blue-700">
            WHY ARIRENT
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
            Simple. Organized. Reliable
          </h2>

          <p className="mt-6 mb-8 text-gray-500 leading-relaxed text-sm sm:text-base">
            AriRent brings your rental operations into one convenient system,
            helping you spend less time managing paperwork and more time
            managing your properties.
          </p>

          <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
            <div className="text-blue-700 rounded-full bg-blue-100 py-2 px-5 text-sm sm:text-base">
              Save Time
            </div>

            <div className="text-blue-700 rounded-full bg-blue-100 py-2 px-5 text-sm sm:text-base">
              Reduce Errors
            </div>

            <div className="text-blue-700 rounded-full bg-blue-100 py-2 px-5 text-sm sm:text-base">
              Grow with us
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
