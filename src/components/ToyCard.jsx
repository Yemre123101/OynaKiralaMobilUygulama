import { useState } from "react";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";

export default function ToyCard({ toy, userId }) {
  const [showRentForm, setShowRentForm] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");

  const handleRent = async () => {
    if (!startDate || !endDate) {
      alert("Lütfen tarih seçin");
      return;
    }

    const toyRef = doc(db, "toys", toy.id);

    try {
      await updateDoc(toyRef, {
        isAvailable: false,
        rentals: arrayUnion({
          renterId: userId,
          startDate,
          endDate,
          paymentMethod,
        }),
      });
      alert("Oyuncak kiralandı!");
      setShowRentForm(false);
    } catch (err) {
      console.error(err);
      alert("Bir hata oluştu");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 flex flex-col">
      <div className="h-40 bg-gray-200 rounded-lg mb-3 flex items-center justify-center text-gray-500">
        Oyuncak Foto
      </div>

      <h3 className="text-lg font-semibold">{toy.name}</h3>
      <p className="text-sm text-gray-500">🎂 {toy.ageRange}</p>
      <p className="text-sm text-gray-500">📍 {toy.city}</p>
      <p className="font-bold text-blue-600">₺{toy.price} / gün</p>

      {toy.isAvailable ? (
        <button
          className="mt-3 bg-green-600 text-white py-2 rounded"
          onClick={() => setShowRentForm(!showRentForm)}
        >
          Kirala
        </button>
      ) : (
        <p className="mt-3 text-red-500 font-semibold">Şu an kirada</p>
      )}

      {showRentForm && (
        <div className="mt-3 space-y-2">
          <label>
            Başlangıç:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border p-1 rounded w-full"
            />
          </label>

          <label>
            Bitiş:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border p-1 rounded w-full"
            />
          </label>

          <label>
            Ödeme Yöntemi:
            <select
              className="border p-1 rounded w-full"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="card">Kart ile Ödeme</option>
              <option value="cash">Kapıda Ödeme</option>
            </select>
          </label>

          <button
            onClick={handleRent}
            className="w-full bg-blue-600 text-white p-2 rounded"
          >
            Onayla
          </button>
        </div>
      )}
    </div>
  );
}
