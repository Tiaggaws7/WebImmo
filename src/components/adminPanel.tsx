import React, { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, LogOutIcon } from 'lucide-react';

import {houses as houseData} from '../data/house'

interface House {
    id: number
    title: string
    price: number
    size: number
    type: string
    rooms: number
    bedrooms: number
    bathrooms: number
    amenities: string[]
    location: string
    image: string
    condition: 'vendu' | 'disponible' | 'sous compromis';
  }


const initialHouses: House[] = houseData

const AdminPanel: React.FC = () => {
  const [houses, setHouses] = useState<House[]>(initialHouses);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [newHouse, setNewHouse] = useState<Omit<House, 'id'>>({
    title: '',
    price: 0,
    size: 0,
    type: '',
    rooms: 0,
    bedrooms: 0,
    bathrooms: 0,
    amenities: [],
    location: '',
    image: '',
    condition: 'disponible'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (editingHouse) {
      setEditingHouse({ ...editingHouse, [name]: value });
    } else {
      setNewHouse({ ...newHouse, [name]: value });
    }
  };

  const handleAmenitiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amenities = e.target.value.split(',').map(item => item.trim());
    if (editingHouse) {
      setEditingHouse({ ...editingHouse, amenities });
    } else {
      setNewHouse({ ...newHouse, amenities });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingHouse) {
      setHouses(houses.map(house => house.id === editingHouse.id ? editingHouse : house));
      setEditingHouse(null);
    } else {
      const id = Math.max(...houses.map(house => house.id), 0) + 1;
      setHouses([...houses, { ...newHouse, id }]);
      setNewHouse({
        title: '',
        price: 0,
        size: 0,
        type: '',
        rooms: 0,
        bedrooms: 0,
        bathrooms: 0,
        amenities: [],
        location: '',
        image: '',
        condition: 'disponible'
      });
    }
    setIsFormVisible(false);
  };

  const handleEdit = (house: House) => {
    setEditingHouse(house);
    setIsFormVisible(true);
  };

  const handleDelete = (id: number) => {
    setHouses(houses.filter(house => house.id !== id));
  };

  const handleCancel = () => {
    setEditingHouse(null);
    setNewHouse({
      title: '',
      price: 0,
      size: 0,
      type: '',
      rooms: 0,
      bedrooms: 0,
      bathrooms: 0,
      amenities: [],
      location: '',
      image: '',
      condition: 'disponible'
    });
    setIsFormVisible(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, you would validate credentials against a backend
    if (username === 'admin' && password === 'password') {
      setIsAuthenticated(true);
    } else {
      alert('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Sign in to Admin Panel
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <input type="hidden" name="remember" value="true" />
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="username" className="sr-only">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel - House Management</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center"
          >
            <LogOutIcon className="w-5 h-5 mr-2" />
            Logout
          </button>
        </div>
        
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setIsFormVisible(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add New House
          </button>
        </div>

        {isFormVisible && (
          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-6">{editingHouse ? 'Edit House' : 'Add New House'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={editingHouse ? editingHouse.title : newHouse.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={editingHouse ? editingHouse.price : newHouse.price}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                <input
                  type="number"
                  id="size"
                  name="size"
                  value={editingHouse ? editingHouse.size : newHouse.size}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <input
                  type="text"
                  id="type"
                  name="type"
                  value={editingHouse ? editingHouse.type : newHouse.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="rooms" className="block text-sm font-medium text-gray-700 mb-1">Rooms</label>
                <input
                  type="number"
                  id="rooms"
                  name="rooms"
                  value={editingHouse ? editingHouse.rooms : newHouse.rooms}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                <input
                  type="number"
                  id="bedrooms"
                  name="bedrooms"
                  value={editingHouse ? editingHouse.bedrooms : newHouse.bedrooms}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                <input
                  type="number"
                  id="bathrooms"
                  name="bathrooms"
                  value={editingHouse ? editingHouse.bathrooms : newHouse.bathrooms}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="amenities" className="block text-sm font-medium text-gray-700 mb-1">Amenities (comma-separated)</label>
                <input
                  type="text"
                  id="amenities"
                  name="amenities"
                  value={editingHouse ? editingHouse.amenities.join(', ') : newHouse.amenities.join(', ')}
                  onChange={handleAmenitiesChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={editingHouse ? editingHouse.location : newHouse.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="text"
                  id="image"
                  name="image"
                  value={editingHouse ? editingHouse.image : newHouse.image}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <select
                  id="condition"
                  name="condition"
                  value={editingHouse ? editingHouse.condition : newHouse.condition}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select condition</option>
                  <option value="vendu">Vendu</option>
                  <option value="disponible">Disponible</option>
                  <option value="sous compromis">sous compromis</option>

                </select>
              </div>
              <div className="md:col-span-2 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingHouse ? 'Update House' : 'Add House'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {houses.map(house => (
                <tr key={house.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{house.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{house.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{house.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{house.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      house.condition === 'vendu' ? 'bg-red-100 text-red-800' : 
                      house.condition === 'disponible' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {house.condition === 'vendu' ? 'Vendu' : 
                       house.condition === 'disponible' ? 'Disponible' : 
                       'Sous compromis'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleEdit(house)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <PencilIcon className="h-5 w-5" />
                      <span className="sr-only">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(house.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                      <span className="sr-only">Delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

