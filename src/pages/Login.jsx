import { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

export default function Login({ setUserId }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }
      setUserId(userCredential.user.uid);
      alert(`${isLogin ? "Giriş yapıldı" : "Hesap oluşturuldu"}!`);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">{isLogin ? "Giriş Yap" : "Kayıt Ol"}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="email" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border p-2 rounded" required />
        <input type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-2 rounded" required />
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">{isLogin ? "Giriş Yap" : "Kayıt Ol"}</button>
      </form>
      <p className="text-center mt-4 text-sm text-gray-500">
        {isLogin ? "Hesabın yok mu?" : "Zaten hesabın var mı?"}{" "}
        <span onClick={() => setIsLogin(!isLogin)} className="text-blue-600 cursor-pointer font-semibold">
          {isLogin ? "Kayıt Ol" : "Giriş Yap"}
        </span>
      </p>
    </div>
  );
}
