import UIKit
import Caravel
import RealmSwift

class ViewController: UIViewController {

    @IBOutlet weak var webView: UIWebView!
    
    // A weak reference is better for preventing any strong cycle reference
    private weak var bus: EventBus?
    
    func getRealm() -> Realm {
        var realm: Realm?
        
        try! realm = Realm()
        // As used on another thread, it is preferable to refresh but not mandatory
        realm!.refresh()
        
        return realm!
    }
    
    func listTasks() {
        var outcome: [AnyObject] = []
        
        let list = getRealm().objects(Task).sorted("label")
        
        for e in list {
            outcome.append(["id": e.id, "label": e.label, "isCompleted": e.isCompleted])
        }
        
        self.bus!.post("Tasks", data: outcome)
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        Caravel.get(self, name: "Home", webView: webView, whenReady: { bus in
            self.bus = bus
            
            bus.register("Refresh") { _, _ in
                self.listTasks()
            }
            
            bus.register("Add") { _, rawLabel in
                let label = rawLabel as! String
                let task = Task()
                let realm = self.getRealm()
                
                task.id = NSUUID().UUIDString
                task.label = label
                
                // Any writing has to be done within a write block and with the same Realm instance
                try! realm.write {
                    realm.add(task)
                }
                self.listTasks()
            }
            
            bus.register("Complete") { _, rawData in
                // We have to extract the data from the JSON dictionary
                let data = rawData as! NSDictionary
                let id = data["id"] as! String
                let isCompleted = data["isCompleted"] as! Bool
                let realm = self.getRealm()
                // Assuming the id is correct, otherwise a crash is tolerable
                let task = realm.objects(Task).filter("id = '\(id)'").first!
                
                try! realm.write {
                    task.isCompleted = isCompleted
                }
            }
            
            bus.register("Edit") { _, rawData in
                let data = rawData as! NSDictionary
                let id = data["id"] as! String
                let label = data["label"] as! String
                let realm = self.getRealm()
                let task = realm.objects(Task).filter("id = '\(id)'").first!
                
                try! realm.write {
                    task.label = label
                }
                
                self.listTasks() // Refresh task list
            }
            
            bus.register("Delete") { _, rawId in
                let id = rawId as! String
                let realm = self.getRealm()
                let task = realm.objects(Task).filter("id = '\(id)'").first!
                
                try! realm.write {
                    realm.delete(task)
                }
                
                self.listTasks()
            }
            
            // Post tasks as soon as the bus is ready
            self.listTasks()
        })
        
        webView.loadRequest(NSURLRequest(URL: NSBundle.mainBundle().URLForResource("home", withExtension: "html")!))
        webView.scrollView.bounces = false
        webView.scrollView.contentInset = UIEdgeInsets(top: 20, left: 0, bottom: 0, right: 0)
    }
}

