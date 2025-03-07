import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

export const ChatHeader = ({ username, isOnline, lastSeen, profileImage }) => {
  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return ""
    const date = new Date(lastSeen)
    return `Last seen ${date.toLocaleString()}`
  }

  return (
    <div className="flex items-center p-4 border-b border-gray-700 bg-gray-800">
      <Avatar className="w-10 h-10 mr-3">
        <AvatarImage src={profileImage} alt={`${username}'s avatar`} />
        <AvatarFallback>{username ? username[0].toUpperCase() : "?"}</AvatarFallback>
      </Avatar>
      <div>
        <h2 className="text-lg font-semibold">{username}</h2>
        <p className="text-sm text-gray-400">
          {isOnline ? "Online" : "Offline"}
        </p>
      </div>
    </div>
  )
}