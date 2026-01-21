"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import Icon from "@mdi/react";
import { mdiAccount, mdiCamera, mdiCheck, mdiClose, mdiPencil } from "@mdi/js";
import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function AdminProfile() {
    const [profile, setProfile] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ username: "", nama: "" });
    const [loading, setLoading] = useState(true);

    // Image Crop States
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const imgRef = useRef<HTMLImageElement>(null);
    const [isCropping, setIsCropping] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setProfile(data.data);
                setFormData({ username: data.data.username, nama: data.data.nama || "" });
            }
        } catch (error) {
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                setProfile(data.data);
                setIsEditing(false);
                toast.success("Profile updated successfully!");
                window.dispatchEvent(new Event("profileUpdated"));
            }
        } catch (error) {
            toast.error("Update failed");
        }
    };

    function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined); // Can't set until image load
            const reader = new FileReader();
            reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
            reader.readAsDataURL(e.target.files[0]);
            setIsCropping(true);
        }
    }

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;
        const crop = centerCrop(
            makeAspectCrop({ unit: '%', width: 90 }, 1 / 1, width, height),
            width,
            height
        );
        setCrop(crop);
    }

    async function handleUploadCroppedImage() {
        if (!completedCrop || !imgRef.current) return;

        const canvas = document.createElement('canvas');
        const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
        canvas.width = completedCrop.width;
        canvas.height = completedCrop.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.drawImage(
                imgRef.current,
                completedCrop.x * scaleX,
                completedCrop.y * scaleY,
                completedCrop.width * scaleX,
                completedCrop.height * scaleY,
                0,
                0,
                completedCrop.width,
                completedCrop.height
            );

            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const formData = new FormData();
                formData.append('photo', blob, 'profile.jpg');

                try {
                    const token = localStorage.getItem("token");
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile/photo`, {
                        method: "PUT",
                        headers: { Authorization: `Bearer ${token}` },
                        body: formData,
                    });
                    const data = await res.json();
                    if (data.success) {
                        setProfile((prev: any) => ({ ...prev, profile_pic: data.data.profile_pic }));
                        setIsCropping(false);
                        setImgSrc('');
                        toast.success("Photo updated!");
                        window.dispatchEvent(new Event("profileUpdated"));
                    }
                } catch (error) {
                    toast.error("Upload failed");
                }
            }, 'image/jpeg');
        }
    }

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-8">Admin Profile Settings</h1>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Banner/Header */}
                <div className="h-32 bg-gradient-to-r from-[#00B69B] to-[#00947d]"></div>

                <div className="px-8 pb-8">
                    <div className="relative -mt-16 mb-6 flex flex-col md:flex-row md:items-end gap-6">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-2xl border-4 border-white overflow-hidden bg-gray-200 shadow-lg">
                                {profile?.profile_pic ? (
                                    <img src={profile.profile_pic} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <Icon path={mdiAccount} size={3} />
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-[-10px] right-[-10px] bg-white p-2 rounded-xl shadow-md cursor-pointer hover:bg-gray-50 border border-gray-100 text-[#00B69B]">
                                <Icon path={mdiCamera} size={0.8} />
                                <input type="file" accept="image/*" className="hidden" onChange={onSelectFile} />
                            </label>
                        </div>

                        <div className="flex-grow">
                            <h2 className="text-2xl font-black text-gray-800">{profile?.nama || "Admin Name Not Set"}</h2>
                            <p className="text-gray-500 font-medium tracking-tight">@{profile?.username}</p>
                        </div>

                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="bg-gray-100 text-gray-700 font-bold px-6 py-2.5 rounded-xl hover:bg-gray-200 transition flex items-center gap-2"
                        >
                            <Icon path={isEditing ? mdiClose : mdiPencil} size={0.8} />
                            {isEditing ? "BATAL" : "EDIT PROFIL"}
                        </button>
                    </div>

                    <div className="border-t border-gray-50 pt-8">
                        {isEditing ? (
                            <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Username</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-[#00B69B] outline-none transition font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        value={formData.nama}
                                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 focus:border-[#00B69B] outline-none transition font-bold"
                                        placeholder="Masukkan nama Anda"
                                    />
                                </div>
                                <div className="md:col-span-2 flex justify-end">
                                    <button type="submit" className="bg-[#00B69B] text-white font-black px-10 py-3 rounded-xl shadow-lg shadow-[#00B69B]/20 hover:scale-[1.02] active:scale-95 transition">
                                        SIMPAN PERUBAHAN
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-50">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Username</span>
                                    <span className="text-lg font-bold text-gray-700">{profile?.username}</span>
                                </div>
                                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-50">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Nama Lengkap</span>
                                    <span className="text-lg font-bold text-gray-700">{profile?.nama || "-"}</span>
                                </div>
                                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-50">
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Dibuat Pada</span>
                                    <span className="text-lg font-bold text-gray-700">{new Date(profile?.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Cropper Modal */}
            {isCropping && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="font-bold">Sesuaikan Foto Profil</h2>
                            <button onClick={() => setIsCropping(false)} className="text-gray-400 hover:text-red-500">
                                <Icon path={mdiClose} size={1} />
                            </button>
                        </div>

                        <div className="flex-grow overflow-auto p-4 flex justify-center bg-gray-200">
                            {!!imgSrc && (
                                <ReactCrop
                                    crop={crop}
                                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    aspect={1}
                                    circularCrop
                                >
                                    <img
                                        ref={imgRef}
                                        alt="Crop me"
                                        src={imgSrc}
                                        onLoad={onImageLoad}
                                        style={{ maxWidth: '100%' }}
                                    />
                                </ReactCrop>
                            )}
                        </div>

                        <div className="p-4 border-t flex justify-end gap-3">
                            <button onClick={() => setIsCropping(false)} className="px-6 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">BATAL</button>
                            <button
                                onClick={handleUploadCroppedImage}
                                className="bg-[#00B69B] text-white px-8 py-2 rounded-xl font-bold flex items-center gap-2"
                            >
                                <Icon path={mdiCheck} size={0.8} /> TERAPKAN
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
