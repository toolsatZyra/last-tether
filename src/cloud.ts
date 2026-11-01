import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {validProgress,type Progress} from './simulation';

// The browser receives only a publishable key. RLS owns the security boundary.
export class CloudSaves {
 client:SupabaseClient|null=null;
 constructor(url?:string,key?:string){if(url&&key)this.client=createClient(url,key,{auth:{storageKey:'last-tether-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});}
 get configured(){return this.client!==null;}
 private requireClient(){if(!this.client)throw new Error('Cloud saves are not connected for this build.');return this.client;}
 async user(){const c=this.requireClient();const {data,error}=await c.auth.getUser();if(error){if(error.name==='AuthSessionMissingError')return null;throw error;}return data.user;}
 async signIn(email:string){const {error}=await this.requireClient().auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin+'/'}});if(error)throw error;}
 async signOut(){const {error}=await this.requireClient().auth.signOut();if(error)throw error;}
 async read(){const c=this.requireClient(),user=await this.user();if(!user)throw new Error('Sign in before opening a cloud checkpoint.');const {data,error}=await c.from('last_tether_saves').select('progress,updated_at').eq('user_id',user.id).maybeSingle();if(error)throw error;if(!data)return null;const progress=validProgress(data.progress);if(!progress)throw new Error('This cloud checkpoint is incompatible or damaged. Your local save is unchanged.');return{progress,updatedAt:String(data.updated_at)};}
 async write(progress:Progress){const validated=validProgress(progress);if(!validated)throw new Error('This checkpoint cannot be saved.');const c=this.requireClient(),user=await this.user();if(!user)throw new Error('Sign in before saving to the cloud.');const {error}=await c.from('last_tether_saves').upsert({user_id:user.id,progress:validated},{onConflict:'user_id'});if(error)throw error;}
}
export const cloud=new CloudSaves(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
