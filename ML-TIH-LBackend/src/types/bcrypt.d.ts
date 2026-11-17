declare module 'bcrypt' {
  interface Bcrypt {
    compare(data: string, encrypted: string): Promise<boolean>;
    hash(data: string, saltOrRounds: number | string): Promise<string>;
  }

  const bcrypt: Bcrypt;
  export = bcrypt;
}
