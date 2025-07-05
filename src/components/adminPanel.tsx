import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, LogOutIcon, ArrowRight } from 'lucide-react';
import { Link } from "react-router-dom"
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
    images: [],
    videos: [],
    principalImage: '',
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
        const houseList: House[] = houseSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || '',
            price: data.price || '0',
            size: data.size || '0',
            rooms: data.rooms || '0',
            bedrooms: data.bedrooms || '0',
            bathrooms: data.bathrooms || '0',
            wc: data.wc || '0',
            location: data.location || '',
            description: data.description || '',
            condition: data.condition || 'disponible',
            consomation: data.consomation || 'A',
            principalImage: data.principalImage || '',
            // On garantit que les tableaux ne sont jamais 'undefined'
            images: data.images || [],
            videos: data.videos || [],
            types: data.types || [],
            amenities: data.amenities || [],
          } as House;
        });
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
      const files = Array.from(e.target.files);
      const storage = getStorage();
  
      try {
        const uploadedUrls = await Promise.all(
          files.map(async (file) => {
            const storageRef = ref(storage, `houses/${file.name}-${Date.now()}`);
            const snapshot = await uploadBytes(storageRef, file);
            return await getDownloadURL(snapshot.ref);
          })
        );
  
        const updateState = (prev: House) => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls],
          principalImage: prev.principalImage || uploadedUrls[0],
        });
  
        editingHouse 
          ? setEditingHouse(prev => prev ? updateState(prev) : null)
          : setNewHouse(updateState);
      } catch (error) {
        console.error("Error uploading images:", error);
      }
    }
  };

const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files?.length) {
    const files = Array.from(e.target.files);
    const storage = getStorage();

    try {
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          const storageRef = ref(storage, `houses/videos/${file.name}-${Date.now()}`);
          const snapshot = await uploadBytes(storageRef, file);
          return await getDownloadURL(snapshot.ref);
        })
      );

      const updateState = (prev: House) => ({
        ...prev,
        videos: [...prev.videos, ...uploadedUrls], // Append new video URLs
      });

      editingHouse 
        ? setEditingHouse(prev => prev ? updateState(prev) : null)
        : setNewHouse(updateState);
    } catch (error) {
      console.error("Error uploading videos:", error);
    }
  }
};

const handleDeleteVideo = (index: number) => {
  const currentVideos = editingHouse ? [...editingHouse.videos] : [...newHouse.videos];
  currentVideos.splice(index, 1);

  const update = (prev: House) => ({
    ...prev,
    videos: currentVideos,
  });

  editingHouse 
    ? setEditingHouse(prev => prev ? update(prev) : null)
    : setNewHouse(update);
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
  
    try {
      // Validate images
      if (
        (editingHouse 
          ? !editingHouse.images.length || !editingHouse.principalImage
          : !newHouse.images.length || !newHouse.principalImage)
      ) {
        alert('Please upload at least one image and select a principal image.');
        return;
      }
  
      if (editingHouse) {
        const houseDoc = doc(db, 'houses', editingHouse.id);
        await updateDoc(houseDoc, {
          ...editingHouse,
          // Explicitly include all fields to avoid missing data
          images: editingHouse.images,
          videos: editingHouse.videos || '', // Include video URL
          principalImage: editingHouse.principalImage,
        });
        setHouses(houses.map(h => h.id === editingHouse.id ? editingHouse : h));
        setEditingHouse(null);
      } else {
        const houseWithId = { 
          ...newHouse, 
          id: crypto.randomUUID(),
          // Ensure images array is properly structured
          images: newHouse.images,
          principalImage: newHouse.principalImage
        };
        await addHouseToFirestore(houseWithId);
      }
  
      // Reset state
      setIsFormVisible(false);
      setNewHouse({
        id: '',
        title: '',
        price: '0',
        size: '0',
        types: [],
        rooms: '0',
        bedrooms: '0',
        bathrooms: '0',
        wc: '0',
        amenities: [],
        location: '',
        images: [],
        videos: [],
        principalImage: '',
        description: '',
        condition: 'disponible',
        consomation: 'A'
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
      images: [],
      videos: [],
      principalImage: '',
      description:'',
      condition: 'disponible',
      consomation:'A'
    });
    setIsFormVisible(false);
  };

  const handleDeleteImage = (index: number) => {
    const currentImages = editingHouse ? [...editingHouse.images] : [...newHouse.images];
    currentImages.splice(index, 1);
  
    const update = (prev: House) => {
      const newPrincipal = prev.principalImage === prev.images[index] 
        ? currentImages[0] || ''
        : prev.principalImage;
        
      return {
        ...prev,
        images: currentImages,
        principalImage: newPrincipal,
      };
    };
  
    editingHouse 
      ? setEditingHouse(prev => prev ? update(prev) : null)
      : setNewHouse(update);
  };
  
  const handleSetPrincipalImage = (url: string) => {
    const update = (prev: House) => ({
      ...prev,
      principalImage: url,
    });
  
    editingHouse 
      ? setEditingHouse(prev => prev ? update(prev) : null)
      : setNewHouse(update);
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
    const propertyTypes = ["appartement", "maison", "local commercial", "terrain"]
  
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
          <Link
              to='/'
              className="flex items-center justify-between p-6 bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-4">🏡</span>
                <span className="text-lg font-medium">Retour à l'accueil</span>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </Link>
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
              <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Images (Première image sera la principale par défaut)
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="mb-4"
                  />

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vidéo
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleVideoUpload}
                      accept="video/*"
                      className="mb-4"
                    />
                  
                  <div className="grid grid-cols-3 gap-4">
                    {(editingHouse ? editingHouse.images : newHouse.images).map((url, index) => (
                      <div key={url} className="relative group">
                        <img
                          src={url}
                          alt={`House preview ${index}`}
                          className="h-32 w-full object-cover rounded-md"
                        />
                        
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(index)}
                            className="text-white bg-red-500 p-1 rounded-full mr-2"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                          
                          <label className="flex items-center text-white text-sm">
                            <input
                              type="radio"
                              name="principalImage"
                              checked={(editingHouse ? editingHouse.principalImage : newHouse.principalImage) === url}
                              onChange={() => handleSetPrincipalImage(url)}
                              className="mr-1"
                            />
                            Principale
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aperçu des vidéos
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {(editingHouse ? editingHouse.videos : newHouse.videos).map((url, index) => (
                      <div key={url} className="relative group">
                        <video
                          src={url}
                          controls
                          className="h-48 w-full object-cover rounded-md"
                        />
                        <div className="absolute top-2 right-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteVideo(index)}
                            className="text-white bg-red-500 p-1 rounded-full opacity-50 group-hover:opacity-100 transition-opacity"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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
                  <option value="sous offre">sous offre</option>
                  <option value="en attente">en attente</option>

                </select>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Markdown supporté)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={editingHouse ? editingHouse.description : newHouse.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Utilisez **gras**, *italique*, [liens](https://)..."
                ></textarea>                <p className="mt-1 text-sm text-gray-500">
                Syntaxe supportée :
              </p>
              <ul className="mt-1 text-sm text-gray-500 list-disc list-inside">
                <li><strong>Gras</strong> : <code>**texte**</code> ou <code>__texte__</code></li>
                <li><em>Italique</em> : <code>*texte*</code> ou <code>_texte_</code></li>
                <li><del>Barré</del> : <code>~~texte~~</code></li>
                <li>En-têtes : <code># Titre 1</code> à <code>###### Titre 6</code></li>
                <li>Listes non ordonnées : <code>- élément</code>, <code>* élément</code> ou <code>+ élément</code></li>
                <li>Listes ordonnées : <code>1. élément</code>, <code>2. élément</code>, etc.</li>
                <li>Liens : <code>[texte du lien](https://exemple.com)</code></li>
                <li>Citations : <code> texte cité</code></li>
                <li>Lignes horizontales : <code>---</code>, <code>***</code> ou <code>___</code></li>
              </ul>
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

        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
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
                      house.condition === 'sous compromis' ? 'bg-orange-100 text-orange-800' :
                      house.condition === 'sous offre' ? 'bg-blue-100 text-blue-800' :
                      house.condition === 'en attente' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {house.condition === 'vendu' ? 'Vendu' : 
                       house.condition === 'disponible' ? 'Disponible' : 
                       house.condition === 'sous compromis' ? 'Sous compromis' :
                       house.condition === 'sous offre' ? 'Sous offre' :
                       house.condition === 'en attente' ? 'En attente' :
                       house.condition}
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