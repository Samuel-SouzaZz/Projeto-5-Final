interface Usuario {
    id: number;
    nome: string;
    email: string;
    senha: string
    rank: number;
    pontos: number;
    nivel: number;
    experiencia: number;
    experienciaProximaNivel: number;
    experienciaProximaNivel: number;
    createdAt: Date;
    updatedAt: Date;
}

export default Usuario;