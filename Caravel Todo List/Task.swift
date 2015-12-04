import RealmSwift

class Task: Object {
    dynamic var id = ""
    dynamic var label = ""
    dynamic var isCompleted = false
    
    override static func primaryKey() -> String? {
        return "id"
    }
}