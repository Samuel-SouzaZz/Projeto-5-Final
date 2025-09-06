interface Diciplina {
    id: number;
    nome: string;
    descricao: string;
    createdAt: Date;
    updatedAt: Date;
    exercicios: Exercicios[];
}

export default Diciplina;