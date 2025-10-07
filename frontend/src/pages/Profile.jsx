import React, { useEffect, useRef, useState } from "react";
import { Edit3, Save, X, Linkedin, Camera, PlusCircle, Trash2 } from "lucide-react";

export default function OpuslyProfile() {
  const fileInputRef = useRef(null);
  const [editMode, setEditMode] = useState(false);

  const [user, setUser] = useState({
    name: "Demo User",
    email: "demo@demo.com",
    role: "Student",
    popularity: 0,
    bio: "A passionate learner exploring tech and creativity.",
    linkedin: "https://linkedin.com/in/demo",
    profilePic: "https://avatars.githubusercontent.com/u/9919?v=4",
    skills: ["JavaScript", "React", "Node.js"],
    education: [
      {
        institution: "ABC Institute of Technology",
        degree: "B.Tech in Computer Science",
        from: "2022",
        to: "2026",
        pursuing: true,
      },
    ],
  });

  const [editableUser, setEditableUser] = useState(user);

  const handleChange = (field, value) => {
    setEditableUser({ ...editableUser, [field]: value });
  };

  const toggleEdit = () => {
    setEditMode(!editMode);
    if (!editMode) setEditableUser(user);
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditableUser({ ...editableUser, profilePic: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleSkillChange = (index, value) => {
    const updated = [...editableUser.skills];
    updated[index] = value;
    setEditableUser({ ...editableUser, skills: updated });
  };

  const addSkill = () => {
    setEditableUser({
      ...editableUser,
      skills: [...editableUser.skills, ""],
    });
  };

  const removeSkill = (index) => {
    setEditableUser({
      ...editableUser,
      skills: editableUser.skills.filter((_, i) => i !== index),
    });
  };

  const handleEducationChange = (index, field, value) => {
    const updated = [...editableUser.education];
    updated[index][field] = value;
    if (field === "pursuing" && value === true) updated[index].to = "";
    setEditableUser({ ...editableUser, education: updated });
  };

  const addEducation = () => {
    const newEdu = {
      institution: "",
      degree: "",
      from: "",
      to: "",
      pursuing: false,
    };
    setEditableUser({
      ...editableUser,
      education: [...editableUser.education, newEdu],
    });
  };

  const removeEducation = (index) => {
    setEditableUser({
      ...editableUser,
      education: editableUser.education.filter((_, i) => i !== index),
    });
  };

  const handleSave = () => {
    setUser(editableUser);
    setEditMode(false);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-100">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 px-6 py-4">
        {/* Left (Profile Info) */}
        <div className="col-span-2 bg-white rounded-2xl shadow p-5 flex flex-col items-center justify-center h-[78vh]">
          <h2 className="text-lg font-semibold text-indigo-600 mb-2">
            {editMode ? "Edit Profile" : "Profile"}
          </h2>

          <div className="relative mb-3">
            <img
              src={editableUser.profilePic}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100"
            />
            {editMode && (
              <>
                <button
                  className="absolute bottom-2 right-2 bg-indigo-600 text-white p-1.5 rounded-full hover:bg-indigo-700 transition"
                  onClick={() => fileInputRef.current.click()}
                >
                  <Camera size={16} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePicChange}
                />
              </>
            )}
          </div>

          {editMode ? (
            <input
              type="text"
              value={editableUser.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="text-xl font-semibold text-center border-b border-indigo-300 focus:outline-none mb-1"
            />
          ) : (
            <h2 className="text-xl font-semibold text-gray-800">{user.name}</h2>
          )}

          <p className="text-gray-500 text-sm">{user.email}</p>
          <p className="text-indigo-600 text-sm font-medium">{user.role}</p>

          <p className="text-xs text-gray-600 mt-1">
            Popularity Score:{" "}
            <span className="font-semibold text-indigo-500">
              {user.popularity}
            </span>
          </p>

          {/* Education */}
          <div className="mt-4 w-full text-center">
            <h4 className="text-indigo-600 font-semibold mb-1">Education</h4>
            {editMode ? (
              <div className="space-y-3">
                {editableUser.education.map((edu, i) => (
                  <div
                    key={i}
                    className="border rounded-xl p-3 bg-gray-50 relative text-sm"
                  >
                    <input
                      type="text"
                      placeholder="Institution"
                      value={edu.institution}
                      onChange={(e) =>
                        handleEducationChange(i, "institution", e.target.value)
                      }
                      className="w-full border-b focus:border-indigo-400 p-1 mb-2 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Degree or Standard"
                      value={edu.degree}
                      onChange={(e) =>
                        handleEducationChange(i, "degree", e.target.value)
                      }
                      className="w-full border-b focus:border-indigo-400 p-1 mb-2 focus:outline-none"
                    />
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        placeholder="From"
                        value={edu.from}
                        onChange={(e) =>
                          handleEducationChange(i, "from", e.target.value)
                        }
                        className="w-1/3 border-b focus:border-indigo-400 p-1 focus:outline-none"
                      />
                      {!edu.pursuing && (
                        <input
                          type="text"
                          placeholder="To"
                          value={edu.to}
                          onChange={(e) =>
                            handleEducationChange(i, "to", e.target.value)
                          }
                          className="w-1/3 border-b focus:border-indigo-400 p-1 focus:outline-none"
                        />
                      )}
                      <label className="flex items-center space-x-1 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={edu.pursuing}
                          onChange={(e) =>
                            handleEducationChange(i, "pursuing", e.target.checked)
                          }
                        />
                        <span>Pursuing</span>
                      </label>
                    </div>
                    <button
                      onClick={() => removeEducation(i)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addEducation}
                  className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  <PlusCircle size={16} className="mr-1" /> Add Education
                </button>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                {user.education.map((edu, i) => (
                  <div
                    key={i}
                    className="border p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <h5 className="font-medium text-gray-800">
                      {edu.institution}
                    </h5>
                    <p className="text-gray-600">{edu.degree}</p>
                    <p className="text-xs text-gray-500">
                      {edu.from} – {edu.pursuing ? "Pursuing" : edu.to}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="mt-4 text-center">
            <h4 className="text-indigo-600 font-medium mb-1">Bio</h4>
            {editMode ? (
              <textarea
                value={editableUser.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                className="w-full p-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm"
                rows={2}
              />
            ) : (
              <p className="text-gray-700 italic text-sm">{user.bio}</p>
            )}
          </div>

          {/* LinkedIn */}
          <div className="mt-3 flex items-center justify-center space-x-1 text-sm">
            <Linkedin className="text-indigo-500" size={16} />
            {editMode ? (
              <input
                type="text"
                value={editableUser.linkedin}
                onChange={(e) => handleChange("linkedin", e.target.value)}
                className="border-b focus:outline-none focus:border-indigo-400 text-sm"
              />
            ) : (
              <a
                href={user.linkedin}
                className="text-indigo-600 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
            )}
          </div>

          {/* Buttons */}
          <div className="mt-4">
            {editMode ? (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-md flex items-center space-x-1 hover:bg-indigo-700 text-sm"
                >
                  <Save size={16} /> <span>Save</span>
                </button>
                <button
                  onClick={toggleEdit}
                  className="bg-gray-200 px-3 py-1.5 rounded-md flex items-center space-x-1 hover:bg-gray-300 text-sm"
                >
                  <X size={16} /> <span>Cancel</span>
                </button>
              </div>
            ) : (
              <button
                onClick={toggleEdit}
                className="bg-indigo-500 text-white px-3 py-1.5 rounded-md flex items-center space-x-1 hover:bg-indigo-600 text-sm"
              >
                <Edit3 size={16} /> <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-2xl shadow p-5 h-[78vh] overflow-hidden flex flex-col">
          <h3 className="text-lg font-semibold text-indigo-600 mb-3 text-center">
            My Skills
          </h3>
          {editMode ? (
            <div className="space-y-2 overflow-y-auto">
              {editableUser.skills.map((skill, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => handleSkillChange(index, e.target.value)}
                    className="border-b flex-1 focus:outline-none focus:border-indigo-400 text-sm"
                  />
                  <button
                    onClick={() => removeSkill(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={addSkill}
                className="mt-1 text-indigo-500 hover:text-indigo-700 font-medium text-sm"
              >
                + Add Skill
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {user.skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium hover:bg-indigo-100"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
