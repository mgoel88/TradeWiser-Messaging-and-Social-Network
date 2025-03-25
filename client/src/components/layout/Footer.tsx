import { Link } from "wouter";
import { Leaf } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const Footer = () => {
  return (
    <footer className="bg-primary text-white mt-8">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Leaf className="h-6 w-6 mr-2" />
              <h2 className="font-heading font-bold text-xl">{APP_NAME}</h2>
            </div>
            <p className="text-gray-200 text-sm">
              Connecting agricultural communities across India for better trade and information sharing.
            </p>
          </div>
          <div>
            <h3 className="font-heading font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-gray-200 hover:text-white">Home</Link></li>
              <li><Link href="/circles" className="text-gray-200 hover:text-white">Explore Circles</Link></li>
              <li><Link href="/commodities" className="text-gray-200 hover:text-white">Market Data</Link></li>
              <li><Link href="/profile" className="text-gray-200 hover:text-white">Business Directory</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="text-gray-200 hover:text-white">Help Center</Link></li>
              <li><Link href="/kyc" className="text-gray-200 hover:text-white">KYC Verification</Link></li>
              <li><Link href="/commodities" className="text-gray-200 hover:text-white">Commodity Guide</Link></li>
              <li><Link href="#" className="text-gray-200 hover:text-white">Trading Tips</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <span className="w-5 inline-flex justify-center mr-2">✉️</span> 
                support@krishiconnect.com
              </li>
              <li className="flex items-center">
                <span className="w-5 inline-flex justify-center mr-2">📞</span> 
                +91 98765 43210
              </li>
              <li className="flex items-center">
                <span className="w-5 inline-flex justify-center mr-2">📍</span> 
                Delhi, India
              </li>
            </ul>
            <div className="mt-4 flex space-x-4">
              <a href="#" className="text-gray-200 hover:text-white">
                <span role="img" aria-label="facebook">📱</span>
              </a>
              <a href="#" className="text-gray-200 hover:text-white">
                <span role="img" aria-label="twitter">🐦</span>
              </a>
              <a href="#" className="text-gray-200 hover:text-white">
                <span role="img" aria-label="instagram">📷</span>
              </a>
              <a href="#" className="text-gray-200 hover:text-white">
                <span role="img" aria-label="linkedin">💼</span>
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-300">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
