// HC
// Copyright 2020 Mukunda Johnson <mukunda@mukunda.com>
///////////////////////////////////////////////////////////////////////////////

import Context, {gl} from "./context.js";
import Buffer from "./buffer.js";
import Packer from "./packer.js";
import Shader, {ShaderSource} from "./shader.js";

const hc = {
   Init : Context.Init,
   Buffer, Packer, Shader, ShaderSource, Context,
   get gl() { return gl; }
};

export default hc;
