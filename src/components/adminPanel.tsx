import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, LogOutIcon } from 'lucide-react';
import { House } from '../types';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth } from '../firebase-config';


const AdminPanel: React.FC = () => {
  const [houses, setHouses] = useState<House[]>([]);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null); // Stocke l'utilisateur Firebase
  const [error, setError] = useState('');
  const [newHouse, setNewHouse] = useState<House>({
    id:'',
    title: '',
    price: '0',
    size: '0',
    types: [],
    rooms: '0',
    bedrooms: '0',
    bathrooms: '0',
    wc:'0',
    amenities: [],
    location: '',
    image: '',
    description:'',
    condition: 'disponible',
    consomation:'A'
  });
  const [tempAmenitiesInput, setTempAmenitiesInput] = React.useState<string>(''); // Temporary input state

  // Fetch houses from Firestore
  useEffect(() => {
    const fetchHouses = async () => {
      try {
        const houseCollection = collection(db, 'houses');
        const houseSnapshot = await getDocs(houseCollection);
        const houseList: House[] = houseSnapshot.docs.map((doc) => ({
          ...(doc.data() as House),
          id: doc.id,
        }));
        setHouses(houseList);
      } catch (error) {
        console.error('Error fetching houses:', error);
      }
    };

    fetchHouses();
  }, []);

  useEffect(() => {
    if (editingHouse) {
      setTempAmenitiesInput(editingHouse.amenities.join(', '));
    } else {
      setTempAmenitiesInput(newHouse.amenities.join(', '));
    }
  }, [editingHouse, newHouse]);

  // Add a house to Firestore
  const addHouseToFirestore = async (house: House) => {
    try {
      const houseCollection = collection(db, "houses");
      const docRef = await addDoc(houseCollection, house);
  
      setHouses([...houses, { ...house, id: docRef.id }]);
      console.log("House added to Firestore with ID:", docRef.id);
    } catch (error) {
      console.error("Error adding house:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      console.log("File selected for upload:", file);
  
      if (!file.type.startsWith("image/")) {
        alert("Please upload a valid image file.");
        return;
      }
  
      try {
        // Initialize Firebase Storage
        const storage = getStorage();
        const storageRef = ref(storage, `houses/${file.name}-${Date.now()}`); // Unique file name with timestamp
  
        // Upload the file to Firebase Storage
        console.log("Uploading file to Firebase Storage...");
        const snapshot = await uploadBytes(storageRef, file);
  
        // Get the URL of the uploaded file
        console.log("Fetching download URL...");
        const downloadURL = await getDownloadURL(snapshot.ref);
  
        console.log("File uploaded successfully. Download URL:", downloadURL);
  
        // Update the state with the image URL
        const updateState = (prev: any) => ({
          ...prev,
          image: downloadURL, // Save the URL, not Base64
        });
  
        console.log("Updating state with image URL...");
        editingHouse
          ? setEditingHouse((prev) => (prev ? updateState(prev) : null))
          : setNewHouse(updateState);
  
        // Reset the file input
        console.log("Resetting file input field...");
        e.target.value = "";
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    } else {
      console.warn("No file was selected.");
    }
  };
  
  
  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (editingHouse) {
      setEditingHouse({ ...editingHouse, [name]: value } as House);
    } else {
      setNewHouse({ ...newHouse, [name]: value });
    }
  };

  // Handle amenities change
  const handleAmenitiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempAmenitiesInput(e.target.value); // Update raw input value
  };
  
  const handleAmenitiesBlur = () => {
    const amenities = tempAmenitiesInput
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item); // Remove empty strings
  
    if (editingHouse) {
      setEditingHouse({ ...editingHouse, amenities });
    } else {
      setNewHouse({ ...newHouse, amenities });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    console.log('Submitting form with:', newHouse, editingHouse);
  
    try {
      // Ensure the image URL is available before proceeding
      if (!newHouse.image && !editingHouse?.image) {
        alert('Please upload an image before submitting the form.');
        return;
      }
  
      if (editingHouse) {
        // Update an existing house
        const houseDoc = doc(db, 'houses', editingHouse.id);
        await updateDoc(houseDoc, {
          ...editingHouse,
        });
        setHouses(
          houses.map((house) =>
            house.id === editingHouse.id ? editingHouse : house
          )
        );
        setEditingHouse(null);
      } else {
        // Add a new house
        const customId = crypto.randomUUID(); // Generate a unique ID for the new house
        const houseWithId = { ...newHouse, id: customId };

        await addHouseToFirestore(houseWithId);
      }
  
      // Reset form visibility and state
      setIsFormVisible(false);
      setNewHouse({
        id:'',
        title: '',
        price: '0',
        size: '0',
        types: [],
        rooms: '0',
        bedrooms: '0',
        bathrooms: '0',
        wc:'0',
        amenities: [],
        location: '',
        image: '',
        description:'',
        condition: 'disponible',
        consomation:'A'
      });
    } catch (error) {
      console.error('Error submitting house:', error);
    }
  };

  // Edit house
  const handleEdit = (house: House) => {
    setEditingHouse(house);
    setIsFormVisible(true);
  };

  // Delete house
  const handleDelete = async (id: string) => {
    try {
      const houseDoc = doc(db, 'houses', id);
      await deleteDoc(houseDoc);
      setHouses(houses.filter((house) => house.id !== id));
    } catch (error) {
      console.error('Error deleting house:', error);
    }
  };

  const handleCancel = () => {
    setEditingHouse(null);
    setNewHouse({
      id:'',
      title: '',
      price: '0',
      size: '0',
      types: [],
      rooms: '0',
      bedrooms: '0',
      bathrooms: '0',
      wc:'0',
      amenities: [],
      location: '',
      image: '',
      description:'',
      condition: 'disponible',
      consomation:'A'
    });
    setIsFormVisible(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, username, password);
      alert("Bienvenue !");
       // Navigate to the admin dashboard
    } catch (err: any) {
      setError("Problème d'email ou de mot de passe. Veuillez réessayer.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Déconnexion réussie");
    } catch (err: any) {
      console.error("Erreur lors de la déconnexion :", err.message);
    }
  };

  // Vérifie l'état de connexion lors du chargement de l'application
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user); // Stocke l'utilisateur connecté
      } else {
        setUser(null); // Réinitialise si déconnecté
      }
    });

    return () => unsubscribe();
  }, []);

  interface PropertyTypeSelectorProps {
    selectedTypes: string[]
    onChange: (types: string[]) => void
  }
  
  function PropertyTypeSelector({ selectedTypes, onChange }: PropertyTypeSelectorProps) {
    const propertyTypes = ["Appartement", "Maison", "Local commercial", "Terrain"]
  
    const toggleType = (type: string) => {
      const newTypes = selectedTypes.includes(type) ? selectedTypes.filter((t) => t !== type) : [...selectedTypes, type]
      onChange(newTypes)
    }
  
    return (
      <div className="flex flex-wrap gap-2">
        {propertyTypes.map((type) => (
          <button
            key={type}
            onClick={() => toggleType(type)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${
                selectedTypes.includes(type) ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            type="button"
          >
            {type}
          </button>
        ))}
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Interface d'administration
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <input type="hidden" name="remember" value="true" />
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="username" className="sr-only">Identifiant</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Identifiant"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Mot de passe</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Mot de passe"
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
                Valider
              </button>
            </div>
          </form>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Interface d'administration - Management des biens</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center"
          >
            <LogOutIcon className="w-5 h-5 mr-2" />
            Se déconnecter
          </button>
        </div>
        
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setIsFormVisible(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Ajouter un nouveau bien
          </button>
        </div>

        {isFormVisible && (
          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-6">{editingHouse ? 'Edit House' : 'Add New House'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
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
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Prix</label>
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
                <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">Surface</label>
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de Propriété</label>
                <PropertyTypeSelector
                  selectedTypes={editingHouse ? editingHouse.types : newHouse.types}
                  onChange={(types) => {
                    if (editingHouse) {
                      setEditingHouse({ ...editingHouse, types })
                    } else {
                      setNewHouse({ ...newHouse, types })
                    }
                  }}
                />
              </div>
              <div>
                <label htmlFor="rooms" className="block text-sm font-medium text-gray-700 mb-1">Pièces</label>
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
                <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">Chambres</label>
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
                <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">Salle de bains</label>
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
                <label htmlFor="wc" className="block text-sm font-medium text-gray-700 mb-1">
                  WC
                </label>
                <input
                  type="number"
                  id="wc"
                  name="wc"
                  value={editingHouse ? editingHouse.wc : newHouse.wc}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="consomation" className="block text-sm font-medium text-gray-700 mb-1">
                  Consommation énergétique
                </label>
                <select
                  id="consomation"
                  name="consomation"
                  value={editingHouse ? editingHouse.consomation : newHouse.consomation}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="F">F</option>
                  <option value="G">G</option>
                </select>
              </div>
              <div>
                <label htmlFor="amenities" className="block text-sm font-medium text-gray-700 mb-1">
                Annexes (séparées par une virgule)
                </label>
                <input
                  type="text"
                  id="amenities"
                  name="amenities"
                  value={tempAmenitiesInput} // Use the temporary input state
                  onChange={handleAmenitiesChange} // Update temp state
                  onBlur={handleAmenitiesBlur} // Process into amenities array on blur
                  placeholder="exemple: piscine,parking,ascenseur"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
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
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                Image
              </label>
              <input
                type="file"
                id="image"
                name="image"
                onChange={handleImageUpload}
                accept="image/*"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {newHouse.image && (
                <img
                  src={newHouse.image}
                  alt="Uploaded preview"
                  className="mt-4 h-32 w-32 object-cover rounded-md"
                />
              )}
            </div>
              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">État</label>
                <select
                  id="condition"
                  name="condition"
                  value={editingHouse ? editingHouse.condition : newHouse.condition}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selectionnez une condition</option>
                  <option value="vendu">Vendu</option>
                  <option value="disponible">Disponible</option>
                  <option value="sous compromis">sous compromis</option>

                </select>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={editingHouse ? editingHouse.description : newHouse.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localisation</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">État</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {houses.map(house => (
                <tr key={house.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{house.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{house.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(() => {
                      const cleanPrice = house.price.replace(/[^0-9.-]+/g, ''); // Remove non-numeric characters
                      const numericPrice = Number(cleanPrice); // Convert to a number
                      return !isNaN(numericPrice)
                        ? numericPrice.toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                            minimumFractionDigits: 0, // No centimes
                            maximumFractionDigits: 0, // No centimes
                          })
                        : 'Invalid price';
                    })()}</td>
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
                      <span className="sr-only">Modifier</span>
                    </button>
                    <button
                      onClick={() => handleDelete(house.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                      <span className="sr-only">Supprimer</span>
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