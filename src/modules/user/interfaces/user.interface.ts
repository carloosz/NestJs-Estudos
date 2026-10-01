export interface UserInterface {
   nickname: string;
   name: string;
   password: string;
   salt: string;
   active: boolean;
   bio?: string;
   location?: string
   socialmedia?: string
}
