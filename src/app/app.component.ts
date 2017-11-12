import { Component } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from 'angularfire2/firestore';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/take';

import * as firebase from 'firebase/app';
import { PACKAGE_ROOT_URL } from '@angular/core/src/application_tokens';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'app-reciator';

  // private itemDoc: AngularFirestoreDocument<any>;
  // item: Observable<any>;

  // private itemCollection: AngularFirestoreCollection<any>;
  // items: Observable<any[]>;

  private userCollection: AngularFirestoreCollection<any>;
  allUsers$: Observable<any>;
  allUserValues: any[];
  otherUsers: any[] = [];
  currentLoggedInUser: Observable<any>;

  private userInfo: any;
  currentUserRefId: any = null;
  currentUserDoc: AngularFirestoreDocument<any>;

  constructor(private db: AngularFirestore, private afAuth: AngularFireAuth) {

    this.userCollection = db.collection<any>('users');
    this.allUsers$ = this.userCollection.snapshotChanges().map(s => {
      console.log('User snapshot changes', s);
      return s.map(p => {
        let cur = p.payload.doc.data();
        let id = p.payload.doc.id;
        return { id, ...cur };
      });
    });


    this.allUsers$.subscribe(x => {
      console.log(x);
      this.allUserValues = x;

      if (this.currentUserRefId) {
        this.otherUsers = x.filter(user => user.id !== this.currentUserRefId);
      }
    })

  }

  appreciate(user) {
    this.db.collection('users').doc(user.id).update({
      appreciationCounter: user.appreciationCounter + 1
    });
  }


  login() {
    this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .then(s => {
        this.userInfo = s.additionalUserInfo;
        console.log(s);

        if (this.userInfo.isNewUser) {
          //add to the collection
          this.userCollection.add({
            uid: this.userInfo.profile.id,
            name: this.userInfo.profile.name,
            appreciationCounter: 0,
            appreciated: [],
            appreciatedBy: []
          }).then(ref => {
            this.currentUserRefId = ref.id;
            console.log(this.currentUserRefId);
            this.currentLoggedInUser = this.db.doc('users/' + this.currentUserRefId).valueChanges();
            this.otherUsers = this.allUserValues.filter(x => x.id !== this.currentUserRefId);

          });
        } else {
          let curr = this.allUserValues.find(p => p.uid === this.userInfo.profile.id);
          if (curr) {
            this.currentUserRefId = curr.id;
            console.log(this.currentUserRefId);

            this.currentLoggedInUser = this.db.doc('users/' + this.currentUserRefId).valueChanges();
            this.otherUsers = this.allUserValues.filter(x => x.id !== this.currentUserRefId);

          }

        }


      }).catch(e => {
        console.log('Something went wrong!', e);
      });
  }
  logout() {
    this.afAuth.auth.signOut();
  }

  // addTestUsers() {
  //   for (var i = 0; i < 5; i++) {
  //     this.userCollection.add({
  //       uid: Math.random() * 100,
  //       name: 'Test ' + i,
  //       appreciationCounter: Math.random() * 20,
  //       appreciated: [],
  //       appreciatedBy: []
  //     });
  //   }
  // }
}
