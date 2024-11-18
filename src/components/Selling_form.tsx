import React, { useState, useEffect } from 'react'

export default function Selling_form() {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    phone: '',
    email: '',
    project: '',
    availability: ''
  })

  const [windowHeight, setWindowHeight] = useState(0)

  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    // Here you would typically send the data to your backend
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white p-4 flex items-center justify-center">
      <div 
        className="w-full max-w-5xl bg-white rounded-xl shadow-xl overflow-hidden flex flex-col lg:flex-row"
        style={{ maxHeight: `${windowHeight - 32}px` }}
      >
        <div className="lg:w-2/5 p-6 bg-indigo-600 text-white flex flex-col justify-center">
          <h1 className="text-3xl font-bold mb-4">Sell Your House</h1>
          <p className="text-lg mb-6">Get a free valuation today and let our experts help you maximize your property's value.</p>
          <ul className="space-y-3 text-base">
            <li className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Expert market analysis
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Personalized selling strategy
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Dedicated support throughout the process
            </li>
          </ul>
        </div>
        <form onSubmit={handleSubmit} className="lg:w-3/5 p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-base font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                placeholder="John"
              />
            </div>
            <div>
              <label htmlFor="surname" className="block text-base font-medium text-gray-700 mb-1">Surname</label>
              <input
                type="text"
                id="surname"
                name="surname"
                required
                value={formData.surname}
                onChange={handleChange}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
                placeholder="Doe"
              />
            </div>
          </div>
          <div>
            <label htmlFor="phone" className="block text-base font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="(123) 456-7890"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-base font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="johndoe@example.com"
            />
          </div>
          <div>
            <label htmlFor="project" className="block text-base font-medium text-gray-700 mb-1">Your Real Estate Project</label>
            <textarea
              id="project"
              name="project"
              rows={3}
              value={formData.project}
              onChange={handleChange}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="Describe your real estate project (e.g., selling a 3-bedroom house, looking for an investment property)"
            ></textarea>
          </div>
          <div>
            <label htmlFor="availability" className="block text-base font-medium text-gray-700 mb-1">Your Availabilities</label>
            <textarea
              id="availability"
              name="availability"
              rows={3}
              value={formData.availability}
              onChange={handleChange}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out"
              placeholder="e.g., Weekdays after 5 PM, Weekends 9 AM - 5 PM"
            ></textarea>
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              Get Your Free Valuation
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}